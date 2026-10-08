const userService = require("../services/user.service");

exports.listPendingStudents = async (req, res, next) => {
  try {
    const users = await userService.listUsers({
      role: "STUDENT",
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

exports.approveStudent = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus(
      req.params.id,
      "APPROVED",
      ["STUDENT"]
    );

    return res.json({
      success: true,
      message: "Student approved successfully",
      user: userService.sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectStudent = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus(
      req.params.id,
      "REJECTED",
      ["STUDENT"]
    );

    return res.json({
      success: true,
      message: "Student registration rejected",
      user: userService.sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};
