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

const os = require("os");

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

app.listen(PORT, '0.0.0.0', () => {
  const networkIp = getLocalIp();
  console.log(`UPASTHIT server running on port ${PORT} (all interfaces)`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${networkIp}:${PORT}`);
});
