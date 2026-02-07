const { JWT_SECRET, AuthMiddleware } = require("../middleware/AuthMiddleware");
let crimeControllerFactory = require("../controllers/crimeController");
const savedLocationControllerFactory = require("../controllers/savedLocationController");

module.exports = function(app, io) {
    const crimeController = crimeControllerFactory(io);
    const savedLocationController = savedLocationControllerFactory(io);

    app.get("/api/health", (req, res) => {
        res.json({ status: "ok" });
    });

    app.post("/api/crime/maparea", async (req, res) => {
        crimeController.mapArea(req, res);
    });

    // Save a location for the user
    app.post("/api/location/save", AuthMiddleware, async (req, res) => {
        savedLocationController.saveLocation(req, res);
    });

    app.get("/api/location/saved", AuthMiddleware, async (req, res) => {
        savedLocationController.getSavedLocations(req, res);
    });

    app.delete("/api/location/delete/:id", AuthMiddleware, async (req, res) => {
        savedLocationController.deleteLocation(req, res);
    });
};