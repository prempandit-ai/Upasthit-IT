const errorHandler = (err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists",
    });
  }

  // Handle Prisma Validation / Internal database errors cleanly
  if (err.name === "PrismaClientValidationError" || err.name === "PrismaClientKnownRequestError") {
    return res.status(500).json({
      success: false,
      message: "Database operation failed. Please contact administrator or check server logs.",
    });
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500
      ? "Internal server error. Please try again later."
      : err.message || "Something went wrong";

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

module.exports = { errorHandler, notFoundHandler };
