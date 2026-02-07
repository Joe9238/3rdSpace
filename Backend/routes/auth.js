let authControllerFactory = require("../controllers/authController");
let authController;
let { JWT_SECRET, AuthMiddleware } = require("../middleware/AuthMiddleware");


module.exports = function(app, io) {
    authController = authControllerFactory(io);
    // Register
    app.post("/api/auth/register", async (req, res) => {
        authController.register(req, res);
    });

    // Login
    app.post("/api/auth/login", async (req, res) => {
        authController.login(req, res);
    });

    // Refresh token 
    app.post("/api/auth/refresh", async (req, res) => {
        authController.refreshToken(req, res);
    });

    // Logout: delete refresh token
    app.post("/api/auth/logout", AuthMiddleware, async (req, res) => {
        authController.logout(req, res);
    });

    // Logout everywhere: delete all refresh tokens for user
    app.post("/api/auth/logout-everywhere", AuthMiddleware, async (req, res) => {
        authController.logoutEverywhere(req, res);
    });

    // Change password (already logged in)
    app.post("/api/auth/change-password", AuthMiddleware, async (req, res) => {
        authController.changePassword(req, res);
    });

    // Change username (already logged in)
    app.post("/api/auth/change-username", AuthMiddleware, async (req, res) => {
        authController.changeUsername(req, res);
    });

    //validate token
    app.post("/api/auth/validate", AuthMiddleware, (req, res) => {
        res.json({ status: "ok" });
    });

    // Delete user
    app.delete("/api/auth/delete", AuthMiddleware, async (req, res) => {
        authController.deleteUser(req, res);
    });

    app.get("/api/auth/me", AuthMiddleware, async (req, res) => {
        authController.getMe(req, res);
    });
};