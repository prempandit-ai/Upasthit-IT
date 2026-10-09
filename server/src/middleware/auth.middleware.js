const prisma = require("../config/prisma");
const { verifyToken } = require("../utils/jwt");

module.exports = async (req, res, next) => {
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

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        status: true,
        tokenVersion: true,
        mustChangePassword: true,
      },
    });

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        message: "User account not found or has been removed",
      });
    }

    if (!dbUser.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    if (
      decoded.tokenVersion !== undefined &&
      decoded.tokenVersion !== dbUser.tokenVersion
    ) {
      return res.status(401).json({
        success: false,
        message: "Session expired or invalidated. Please log in again.",
      });
    }

    req.user = {
      ...decoded,
      status: dbUser.status,
      mustChangePassword: dbUser.mustChangePassword,
      tokenVersion: dbUser.tokenVersion,
    };
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
