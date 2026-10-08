const jwt = require("jsonwebtoken");

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required.");
  }

  return process.env.JWT_SECRET;
}

function generateToken(payload, options = {}) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    ...options,
  });
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  generateToken,
  verifyToken,
};
