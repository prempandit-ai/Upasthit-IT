require("dotenv").config();

const express = require("express");
const cors = require("cors");

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes        = require("./src/routes/auth.routes");
const adminRoutes       = require("./src/routes/admin.routes");
const hodRoutes         = require("./src/routes/hod.routes");
const coordinatorRoutes = require("./src/routes/coordinator.routes");
const departmentRoutes  = require("./src/routes/department.routes");
const studentRoutes     = require("./src/routes/student.routes");
const facultyRoutes     = require("./src/routes/faculty.routes");
const subjectRoutes     = require("./src/routes/subject.routes");
const importRoutes      = require("./src/routes/import.routes");

const { errorHandler, notFoundHandler } = require("./src/middleware/error.middleware");

const app = express();

// ─── CORS ──────────────────────────────────────────────────────────────────────
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

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowedOrigins]));

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);

    const isLocalhost =
      /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
        origin
      );

    if (isLocalhost) return callback(null, true);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

// ─── Health Checks ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ success: true, message: "UPASTHIT Backend Running", version: "2.0.0" });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Upasthit backend connected", timestamp: new Date().toISOString() });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/admin",       adminRoutes);
app.use("/api/hod",         hodRoutes);
app.use("/api/coordinator", coordinatorRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/students",    studentRoutes);
app.use("/api/student",     studentRoutes);
app.use("/api/faculty",     facultyRoutes);
app.use("/api/subjects",    subjectRoutes);
app.use("/api/import",      importRoutes);

// ─── Error Handlers ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;