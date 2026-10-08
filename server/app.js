require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/auth.routes");
const adminRoutes = require("./src/routes/admin.routes");
const hodRoutes = require("./src/routes/hod.routes");
const coordinatorRoutes = require("./src/routes/coordinator.routes");
const { errorHandler, notFoundHandler } = require("./src/middleware/error.middleware");

const app = express();

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:19006",
  "http://localhost:3000",
];

const envAllowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([...defaultAllowedOrigins, ...envAllowedOrigins])
);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (e.g. mobile native apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    // Allow configured origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, permit localhost / 127.0.0.1 / local network IPs on any port
    const isLocalhost =
      /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
        origin
      );

    if (isLocalhost) {
      return callback(null, true);
    }

    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204,
};

// Register CORS middleware BEFORE routes
app.use(cors(corsOptions));

app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "UPASTHIT Backend Running",
    version: "1.0.0",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Upasthit backend connected",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hod", hodRoutes);
app.use("/api/coordinator", coordinatorRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;