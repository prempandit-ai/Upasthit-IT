const { verifyToken } = require("../utils/jwt");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token missing",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token missing",
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Token expired"
        : "Invalid or malformed token";

    return res.status(401).json({
      success: false,
      message,
    });
  }
};
