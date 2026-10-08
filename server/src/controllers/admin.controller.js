const prisma = require("../config/prisma");
const userService = require("../services/user.service");

exports.createHod = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await userService.createApprovedUser({
      name,
      email,
      password,
      role: "HOD",
    });

    return res.status(201).json({
      success: true,
      message: "HOD account created successfully",
      user: userService.sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.createFaculty = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await userService.createApprovedUser({
      name,
      email,
      password,
      role: "FACULTY",
    });

    return res.status(201).json({
      success: true,
      message: "Faculty account created successfully",
      user: userService.sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const { role, status } = req.query;
    const users = await userService.listUsers({ role, status });

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

exports.approveUser = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, "APPROVED");

    return res.json({
      success: true,
      message: "User approved successfully",
      user: userService.sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectUser = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, "REJECTED");

    return res.json({
      success: true,
      message: "User rejected successfully",
      user: userService.sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    return res.json({
      success: true,
      message: "User deactivated successfully",
      user: userService.sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};
