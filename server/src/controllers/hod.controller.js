const userService = require("../services/user.service");

exports.createCoordinator = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await userService.createApprovedUser({
      name,
      email,
      password,
      role: "COORDINATOR",
    });

    return res.status(201).json({
      success: true,
      message: "Coordinator account created successfully",
      user: userService.sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.listPendingFaculty = async (req, res, next) => {
  try {
    const users = await userService.listUsers({
      role: "FACULTY",
      status: "PENDING",
    });

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

exports.approveFaculty = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus(
      req.params.id,
      "APPROVED",
      ["FACULTY"]
    );

    return res.json({
      success: true,
      message: "Faculty approved successfully",
      user: userService.sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectFaculty = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus(
      req.params.id,
      "REJECTED",
      ["FACULTY"]
    );

    return res.json({
      success: true,
      message: "Faculty registration rejected",
      user: userService.sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};
