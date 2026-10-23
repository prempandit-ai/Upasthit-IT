const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : [req.user.role];

    if (!roles.some((role) => userRoles.includes(role))) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };
};

module.exports = authorize;
