
const SavedLocation = require("../models/SavedLocation");


module.exports = function(io) {
    async function saveLocation(req, res) {
        try {
            const db = req.app.locals.db;
            const userId = req.user && req.user.userId;
            const { name, lat, lng } = req.body;
            const latNum = typeof lat === 'number' ? lat : parseFloat(lat);
            const lngNum = typeof lng === 'number' ? lng : parseFloat(lng);
            if (!userId || !name || isNaN(latNum) || isNaN(lngNum)) {
                return res.status(400).json({ error: 'Missing or invalid fields', debug: { userId, name, lat, lng, latNum, lngNum } });
            }
            const id = await SavedLocation.create(db, {
                userId,
                name,
                latitude: latNum,
                longitude: lngNum,
            });
            res.status(201).json({ id, name, lat: latNum, lng: lngNum });
        } catch (err) {
            console.error('Error saving location:', err);
            res.status(500).json({ error: 'Failed to save location' });
        }
    }


    async function getSavedLocations(req, res) {
        try {
            const db = req.app.locals.db;
            const userId = req.user && req.user.userId;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            const locations = await SavedLocation.getAllByUser(db, userId);
            res.json({ locations });
        } catch (err) {
            console.error('Error fetching saved locations:', err);
            res.status(500).json({ error: 'Failed to fetch locations' });
        }
    }

    async function deleteLocation(req, res) {
        try {
            const db = req.app.locals.db;
            const userId = req.user && req.user.userId;
            const id = parseInt(req.params.id, 10);
            if (!userId || !id) return res.status(400).json({ error: 'Missing user or id' });
            const success = await SavedLocation.deleteById(db, userId, id);
            if (success) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Location not found' });
            }
        } catch (err) {
            console.error('Error deleting location:', err);
            res.status(500).json({ error: 'Failed to delete location' });
        }
    }

    return {
        saveLocation,
        getSavedLocations,
        deleteLocation,
    };
};