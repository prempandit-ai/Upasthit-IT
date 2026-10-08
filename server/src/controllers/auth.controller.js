const prisma = require("../config/prisma");
const { comparePassword } = require("../utils/hashPassword");
const { generateToken } = require("../utils/jwt");
const userService = require("../services/user.service");
const { sanitizeUser, buildTokenPayload } = require("../utils/userHelpers");

exports.registerStudent = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await userService.createPendingUser({
      name,
      email,
      password,
      role: "STUDENT",
    });

    return res.status(201).json({
      success: true,
      message:
        "Registration submitted. Your account is pending approval by a Coordinator.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.registerFaculty = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await userService.createPendingUser({
      name,
      email,
      password,
      role: "FACULTY",
    });

    return res.status(201).json({
      success: true,
      message:
        "Registration submitted. Your account is pending approval by HOD or Admin.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: { include: { department: true } },
        facultyProfile: { include: { department: true } },
        hodProfile: { include: { department: true } },
        coordinatorProfile: { include: { department: true } },
        adminProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Contact administrator.",
      });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.status === "PENDING") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is pending approval. You will be able to log in once approved.",
        status: "PENDING",
      });
    }

    if (user.status === "REJECTED") {
      return res.status(403).json({
        success: false,
        message: "Your registration was rejected. Contact administrator.",
        status: "REJECTED",
      });
    }

    const token = generateToken(buildTokenPayload(user));

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        studentProfile: {
          include: {
            department: true,
            subjectEnrollments: {
              include: {
                subject: {
                  include: {
                    facultyAssignments: {
                      include: {
                        faculty: {
                          include: { user: { select: { name: true, email: true } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        facultyProfile: {
          include: {
            department: true,
            subjectAssignments: {
              include: { subject: true },
            },
          },
        },
        hodProfile: { include: { department: true } },
        coordinatorProfile: { include: { department: true } },
        adminProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    if (user.status !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Account is not approved",
        status: user.status,
      });
    }

    return res.json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};
