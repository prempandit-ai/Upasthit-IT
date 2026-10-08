const APPROVED = "APPROVED";

const requireApproved = (req, res, next) => {
  if (req.user?.status !== APPROVED) {
    return res.status(403).json({
      success: false,
      message: "Account is not approved yet. Please wait for administrator approval.",
      status: req.user?.status || "PENDING",
    });
  }

  next();
};

module.exports = requireApproved;
