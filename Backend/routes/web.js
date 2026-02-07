const { JWT_SECRET, AuthMiddleware } = require("../middleware/AuthMiddleware");
let crimeControllerFactory = require("../controllers/crimeController");

module.exports = function(app, io) {
    const crimeController = crimeControllerFactory(io);

    app.get("/api/health", (req, res) => {
        res.json({ status: "ok" });
    });

    app.get("/api/crime/maparea", async (req, res) => {
        crimeController.mapArea(req, res);
    });
};