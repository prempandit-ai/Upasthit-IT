require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is required.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL environment variable is required.");
  process.exit(1);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`UPASTHIT server running on port ${PORT} (all interfaces)`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://192.168.0.106:${PORT}`);
});
