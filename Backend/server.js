
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());

// Add cookie-parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());

/* ====== MySQL DB Access ====== */
const dbConfig = {
  host: process.env.MYSQL_HOST || "mysql",
  user: process.env.MYSQL_USER || "uop_user",
  password: process.env.MYSQL_PASSWORD || "uop_pass",
  database: process.env.MYSQL_DATABASE || "uop_db",
  port: process.env.MYSQL_PORT || 3306
};

let db;
async function connectToDB() {
  try {
    db = await mysql.createPool(dbConfig);
    app.locals.db = db;
    console.log("✅ Connected to MySQL");
  } catch (err) {
    console.error("MySQL connection error:", err);
    process.exit(1);
  }
}

connectToDB();

let port = 9000;

// Allow credentials in CORS for both Docker and host browser
app.use((req, res, next) => {
  const allowedOrigins = ["http://frontend-e2e:3000", "http://localhost:81"];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

/* ====== Init ====== */

const server = app.listen(port, () => {
  console.log("Listening on port " + port);
});

/* ====== Socket.io Setup ====== */
let socketIo = require("socket.io");
let io = socketIo(server, {
  cors: {
    origin: ["http://frontend-e2e:3000", "http://localhost:81"],
    credentials: true
  }
});

io.on("connection", function(socket) {
  console.log("Client connected");
  socket.on("client-server", function(msg) {
    console.log("Received: " + msg); // we dont expect to recieve anything here but if we do, log it
  });
});

/* ====== Route Imports ====== */
require("./routes/auth")(app, io);
require("./routes/web")(app, io);

console.log("Server setup complete.");

module.exports = { app, server, io };
