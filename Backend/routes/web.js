const { JWT_SECRET, AuthMiddleware } = require("../middleware/AuthMiddleware");

module.exports = function(app, io) {
    app.get("/api/health", (req, res) => {
        res.json({ status: "ok" });
    });
};