const jwt = require("jsonwebtoken");

// in real life, read this from process.env.JWT_SECRET
const JWT_SECRET = "a-super-secret-key-that-would-never-be-used-in-production";

function authMiddleware(req, res, next) {
  const token = req.cookies && req.cookies.token;
  
  if (!token) { // token missing either because not signed in or the cookie itself expired
    return res.status(401).json({ error: "User not signed in" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; 
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = {
  AuthMiddleware: authMiddleware,
  JWT_SECRET
};
