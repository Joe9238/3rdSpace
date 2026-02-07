

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
        const minLat = Math.min(...polyCoords.map(p => p.lat));
        const maxLat = Math.max(...polyCoords.map(p => p.lat));
        const minLng = Math.min(...polyCoords.map(p => p.lng));
        const maxLng = Math.max(...polyCoords.map(p => p.lng));

        const gridRows = 10;
        const gridCols = 10;
        const latStep = (maxLat - minLat) / gridRows;
        const lngStep = (maxLng - minLng) / gridCols;

        const last3Months = ["2025-12", "2025-11", "2025-10"];
        // Aggregate all crimes from the last 3 months
        let allCrimes = [];
        for (let month of last3Months) {
            let apiUrl = `https://data.police.uk/api/crimes-street/all-crime?date=${month}&poly=${requestedPoly}`;
            try {
                const response = await axios.get(apiUrl);
                allCrimes = allCrimes.concat(response.data);
            } catch (err) {
                // Optionally, you could log or collect errors per month
            }
        }
        // Build grid and count crimes in each cell (combined)
        let grid = Array.from({ length: gridRows }, () => Array(gridCols).fill(0));
        for (let crime of allCrimes) {
            if (!crime.location) continue;
            const lat = parseFloat(crime.location.latitude);
            const lng = parseFloat(crime.location.longitude);
            // Clamp to grid
            let row = Math.floor((lat - minLat) / latStep);
            let col = Math.floor((lng - minLng) / lngStep);
            // Edge case: max value
            if (row === gridRows) row = gridRows - 1;
            if (col === gridCols) col = gridCols - 1;
            if (row >= 0 && row < gridRows && col >= 0 && col < gridCols) {
                grid[row][col]++;
            }
        }
        // Find max count for normalization
        let maxCount = 0;
        for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < gridCols; c++) {
                if (grid[r][c] > maxCount) maxCount = grid[r][c];
            }
        }
        // Set intensity: 1 if significant (e.g. > 90th percentile), else normalized
        let allCounts = grid.flat();
        let sorted = [...allCounts].sort((a, b) => a - b);
        let crazyThreshold = sorted[Math.floor(0.9 * sorted.length)];
        let heatArray = [];
        for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < gridCols; c++) {
                // Center coordinate of cell
                let centerLat = minLat + (r + 0.5) * latStep;
                let centerLng = minLng + (c + 0.5) * lngStep;
                let count = grid[r][c];
                let intensity = 0;
                if (count >= crazyThreshold && count > 0) {
                    intensity = 1;
                } else if (maxCount > 0) {
                    intensity = count / maxCount;
                }
                // Only include cells with at least some intensity
                if (intensity > 0) {
                    heatArray.push([centerLat, centerLng, intensity]);
                }
            }
        }
        res.json({ message: "Map area data (last 3 months)", heat: heatArray });
    }

    return {
        mapArea,
    };
};