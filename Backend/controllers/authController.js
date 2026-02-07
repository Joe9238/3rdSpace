const User = require("../models/User");
const Token = require("../models/Token");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, AuthMiddleware } = require("../middleware/AuthMiddleware");

module.exports = function(io) {
    async function logout(req, res) {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) {
            const db = req.app.locals.db;
            const tokenRow = await Token.findOne(db, { token: refreshToken, invalidated: false });
            if (tokenRow) {
                await Token.updateMany(db, { id: tokenRow.id }, { invalidated: true });
            }
        }
        res.clearCookie("token", { sameSite: "lax", secure: false });
        res.clearCookie("refreshToken", { sameSite: "lax", secure: false });
        res.json({ message: "Logged out" });
    }

    async function logoutEverywhere(req, res) {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) {
            let userId = null;
            try {
                userId = jwt.verify(refreshToken, JWT_SECRET).userId;
            } catch (e) {}
            if (!userId) {
                return res.status(400).json({ error: "Invalid refresh token" });
            }
            const db = req.app.locals.db;
            await Token.deleteMany(db, { userId });
        }
        res.clearCookie("token", { sameSite: "lax", secure: false });
        res.clearCookie("refreshToken", { sameSite: "lax", secure: false });
        res.json({ message: "Logged out everywhere" });
    }

    // Delete a user by username or from JWT if role is 'user'
    async function deleteUser(req, res) {
        try {
            let usernameToDelete;
            let userToDelete;

            // Try to get JWT from cookies
            const token = req.cookies && req.cookies.token;
            let jwtPayload = null;
            if (token) {
                try {
                    jwtPayload = jwt.verify(token, JWT_SECRET);
                } catch (e) {}
            }

            if (jwtPayload && jwtPayload.userId) {
                const db = req.app.locals.db;
                // get user from DB to check role
                const requestingUser = await User.findById(db, jwtPayload.userId);
                if (!requestingUser) {
                    return res.status(404).json({ error: "Requesting user not found" });
                }
                if (requestingUser.role === 'user') {
                    // Regular user can only delete their own account
                    userToDelete = requestingUser;
                    usernameToDelete = requestingUser.username;
                    // Require password in body
                    const { password } = req.body;
                    if (!password) {
                        return res.status(400).json({ error: "Password required" });
                    }
                    const passwordValid = await bcrypt.compare(password, requestingUser.passwordHash);
                    if (!passwordValid) {
                        return res.status(401).json({ error: "Password is incorrect" });
                    }
                } else if (requestingUser.role === 'admin') {
                    // Admin can delete by username from body
                    const { username } = req.body;
                    if (!username) {
                        return res.status(400).json({ error: "Username required" });
                    }
                    userToDelete = await User.findByUsername(db, username);
                    if (!userToDelete) {
                        return res.status(404).json({ error: "User not found" });
                    }
                    usernameToDelete = username;
                } else {
                    return res.status(403).json({ error: "Unauthorized" });
                }
            } else {
                res.status(403).json({ error: "Unauthorized" });
            }

            // Delete user from MySQL
            const db = req.app.locals.db;
            await User.deleteById(db, userToDelete.id);
            await Token.deleteMany(db, { userId: userToDelete.id });
            res.clearCookie("token", { sameSite: "lax", secure: false });
            res.clearCookie("refreshToken", { sameSite: "lax", secure: false });
            res.json({ message: `User '${usernameToDelete}' deleted` });
        } catch (err) {
            res.status(500).json({ error: "Server error" });
        }
    }

    async function refreshToken(req, res) {
        // Read refresh token from cookie
        const refreshToken = req.cookies && req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token required" });
        }
        try {
            // Verify refresh token
            const payload = jwt.verify(refreshToken, JWT_SECRET);

            // Remove expired tokens for this user
            const db = req.app.locals.db;
            await Token.deleteMany(db, {
                userId: payload.userId,
                expiresAt: { $lt: new Date() }
            });

            // Check if the refresh token exists and its state
            const existingToken = await Token.findOne(db, { token: refreshToken, userId: payload.userId });
            if (!existingToken || existingToken.invalidated || existingToken.expiresAt < new Date()) {
                // If token is missing, invalidated, or expired, remove all tokens for user and return 401
                await Token.deleteMany(db, { userId: payload.userId });
                return res.status(401).json({ error: "Invalid or expired refresh token." });
            }

            // Invalidate the used refresh token
            await Token.updateMany(db, { id: existingToken.id }, { invalidated: true });

            // Issue new tokens
            const user = await User.findById(db, payload.userId);
            if (!user) {
                return res.status(401).json({ error: "User not found" });
            }

            await setAuthCookies(req, res, user);

            res.json({ message: "Refreshed" });
        } catch (err) {
            return res.status(401).json({ error: "Invalid or expired refresh token" });
        }
    }

    async function login(req, res) {
        try {
            const { username, password } = req.body;
            const db = req.app.locals.db;
            const user = await User.findByUsername(db, username);
            if (!user) {
                return res.status(401).json({ error: "Invalid username or password" });
            }
            const passwordValid = await bcrypt.compare(password, user.passwordHash);
            if (!passwordValid) {
                return res.status(401).json({ error: "Invalid username or password" });
            }
            await setAuthCookies(req, res, user);
            res.json({ message: "Logged in" });
        } catch (err) {
            console.error("Login error:", err);
            res.status(500).json({ error: "Server error" });
        }
    }

    // Helper to set auth and refresh tokens as cookies
    async function setAuthCookies(req, res, user) {
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: "5m" }
        );
        // Create refresh token
        const refreshToken = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: "7d" }
        );
        // Store refresh token in DB
        const db = req.app.locals.db;
        await Token.createToken(db, {
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            invalidated: false
        });
        // Set tokens as HTTP-only cookies
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: false, // false for use on localhost
            maxAge: 5 * 60 * 1000, // 5m
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: false, 
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
        });
    }

    // register a new user
    async function register(req, res) {
        try {
            const { username, password } = req.body;

            //Todo add more password constraints
            if (
            !username ||
            !password ||
            password.length < 6 ||
            password.length > 16 ||
            password.includes(" ")
            ) {
            return res.status(400).json({
                error: "Username and password (6-16 chars, no spaces) required",
            });
            }

            // check if username is taken
            const db = req.app.locals.db;
            const existing = await User.findByUsername(db, username);
            if (existing) {
            return res.status(409).json({ error: "Username already taken" });
            }

            // hash password and save user
            const passwordHash = await bcrypt.hash(password, 10);
            const user = await User.createUser(db, { username, passwordHash });

            await setAuthCookies(res, user);

            res.status(201).json({ message: "User registered" });
        } catch (err) {
            res.status(500).json({ error: "Server error" });
        }
    }


    // change password for logged in user
    async function changePassword(req, res) {
        try {
            const token = req.cookies && req.cookies.token;
            if (!token) {
                return res.status(401).json({ error: "Not authenticated" });
            }
            let jwtPayload;
            try {
                jwtPayload = jwt.verify(token, JWT_SECRET);
            } catch (e) {
                return res.status(401).json({ error: "Invalid token" });
            }
            const db = req.app.locals.db;
            const user = await User.findById(db, jwtPayload.userId);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: "Current and new password required" });
            }
            const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!passwordValid) {
                return res.status(401).json({ error: "Current password is incorrect" });
            }
            if (newPassword.length < 6 || newPassword.length > 16 || newPassword.includes(" ")) {
                return res.status(400).json({ error: "Password must be 6-16 characters, no spaces." });
            }
            const newHash = await bcrypt.hash(newPassword, 10);
            await db.query('UPDATE users SET passwordHash = ? WHERE id = ?', [newHash, user.id]);
            // Invalidate all tokens for user (force re-login everywhere)
            // TODO: Remove related tokens for user.id
            res.clearCookie("token", { sameSite: "lax", secure: false });
            res.clearCookie("refreshToken", { sameSite: "lax", secure: false });
            res.json({ message: "Password changed successfully. Please log in again." });
        } catch (err) {
            res.status(500).json({ error: "Server error" });
        }
    }

    // Change username for logged in user
    async function changeUsername(req, res) {
        try {
            const token = req.cookies && req.cookies.token;
            if (!token) {
                return res.status(401).json({ error: "Not authenticated" });
            }
            let jwtPayload;
            try {
                jwtPayload = jwt.verify(token, JWT_SECRET);
            } catch (e) {
                return res.status(401).json({ error: "Invalid token" });
            }
            const db = req.app.locals.db;
            const user = await User.findById(db, jwtPayload.userId);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            const { newUsername } = req.body;
            if (!newUsername || typeof newUsername !== "string" || newUsername.length < 3 || newUsername.length > 20 || newUsername.includes(" ")) {
                return res.status(400).json({ error: "Username must be 3-20 characters, no spaces." });
            }
            // Check if username is taken
            const existing = await User.findByUsername(db, newUsername);
            if (existing) {
                return res.status(409).json({ error: "Username already taken" });
            }
            await User.updateUsername(db, user.id, newUsername);

            // Invalidate all tokens for user (force re-login everywhere) because username is in JWT
            // TODO: Remove related tokens for user.id
            res.clearCookie("token", { sameSite: "lax", secure: false });
            res.clearCookie("refreshToken", { sameSite: "lax", secure: false });
            res.json({ message: "Username changed successfully. Please log in again." });
        } catch (err) {
            res.status(500).json({ error: "Server error" });
        }
    }

    async function getMe(req, res) {
        try {
            const token = req.cookies && req.cookies.token;
            if (!token) {
                return res.status(401).json({ error: "Not authenticated" });
            }
            let jwtPayload;
            try {
                jwtPayload = jwt.verify(token, JWT_SECRET);
            } catch (e) {
                return res.status(401).json({ error: "Invalid token" });
            }
            const db = req.app.locals.db;
            const user = await User.findById(db, jwtPayload.userId);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            res.json({ username: user.username });
        } catch (err) {
            res.status(500).json({ error: "Server error" });
        }
    }

    return {
        logout,
        logoutEverywhere,
        refreshToken,
        login,
        register,
        deleteUser,
        changePassword,
        changeUsername,
        getMe
    };
};