

const axios = require("axios");
module.exports = function(io) {
    async function mapArea(req, res) {
        //get request long and lat map bounds
        const { topLeftLong, topLeftLat, bottomLeftLong, bottomLeftLat, bottomRightLong, bottomRightLat, topRightLong, topRightLat } = req.body;
        const requestedPoly = `${topLeftLat},${topLeftLong}:${topRightLat},${topRightLong}:${bottomRightLat},${bottomRightLong}:${bottomLeftLat},${bottomLeftLong}`;
        const polyCoords = requestedPoly.split(":").map(p => {
            const [lat, lng] = p.split(",").map(Number);
            return { lat, lng };
        });
        // Calculate bounds for the selected area
        let minLat = Math.min(...polyCoords.map(p => p.lat));
        let maxLat = Math.max(...polyCoords.map(p => p.lat));
        let minLng = Math.min(...polyCoords.map(p => p.lng));
        let maxLng = Math.max(...polyCoords.map(p => p.lng));

        // Enforce a minimum area of 0.05 x 0.05 degrees for normalization, but keep requested area for display
        const minAreaSize = 0.05;
        const reqMinLat = minLat;
        const reqMaxLat = maxLat;
        const reqMinLng = minLng;
        const reqMaxLng = maxLng;
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        let areaLat = maxLat - minLat;
        let areaLng = maxLng - minLng;
        if (areaLat < minAreaSize) {
            minLat = centerLat - minAreaSize / 2;
            maxLat = centerLat + minAreaSize / 2;
        }
        if (areaLng < minAreaSize) {
            minLng = centerLng - minAreaSize / 2;
            maxLng = centerLng + minAreaSize / 2;
        }

        const gridRows = 10;
        const gridCols = 10;
        // For normalization, use the wider area
        const normLatStep = (maxLat - minLat) / gridRows;
        const normLngStep = (maxLng - minLng) / gridCols;
        // For display, use the requested area
        const dispLatStep = (reqMaxLat - reqMinLat) / gridRows;
        const dispLngStep = (reqMaxLng - reqMinLng) / gridCols;

        const last3Months = ["2025-12", "2025-11", "2025-10"];
        // Aggregate all crimes from the last 3 months
        let allCrimes = [];
        let rateLimited = false;
        let rateLimitMessage = '';
        for (let month of last3Months) {
            let apiUrl = `https://data.police.uk/api/crimes-street/all-crime?date=${month}&poly=${requestedPoly}`;
            try {
                const response = await axios.get(apiUrl);
                allCrimes = allCrimes.concat(response.data);
            } catch (err) {
                if (err.response && err.response.status === 429) {
                    rateLimited = true;
                    rateLimitMessage = err.response.data || 'Rate limit exceeded';
                    break;
                }
                // Optionally, you could log or collect errors per month
            }
        }
        if (rateLimited) {
            return res.status(429).json({ message: 'Police API rate limit exceeded', details: rateLimitMessage });
        }
        // Aggregate crimes at the same coordinate, each adding 0.1 intensity, capped at 1.0
        const coordMap = new Map();
        for (let crime of allCrimes) {
            if (!crime.location) continue;
            const lat = parseFloat(crime.location.latitude);
            const lng = parseFloat(crime.location.longitude);
            if (!pointInPolygon(lat, lng, polyCoords)) continue;
            // Use a fixed precision to group close points (e.g., 5 decimal places ~1m)
            const key = lat.toFixed(5) + ',' + lng.toFixed(5);
            if (!coordMap.has(key)) {
                coordMap.set(key, { lat, lng, intensity: 0 });
            }
            let obj = coordMap.get(key);
            obj.intensity = Math.min(1, obj.intensity + 0.1);
        }
        const heatArray = Array.from(coordMap.values()).map(({ lat, lng, intensity }) => [lat, lng, intensity]);
        res.json({ message: "Map area data (last 3 months)", heat: heatArray });

        // Helper: point-in-polygon (ray-casting algorithm)
        function pointInPolygon(lat, lng, polygon) {
            let inside = false;
            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                const xi = polygon[i].lat, yi = polygon[i].lng;
                const xj = polygon[j].lat, yj = polygon[j].lng;
                const intersect = ((yi > lng) !== (yj > lng)) &&
                    (lat < (xj - xi) * (lng - yi) / (yj - yi + 1e-12) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        }
    }

    return {
        mapArea,
    };
};