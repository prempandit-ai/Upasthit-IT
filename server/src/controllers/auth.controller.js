const prisma = require("../config/prisma");
const { comparePassword, hashPassword } = require("../utils/hashPassword");
const { generateToken } = require("../utils/jwt");
const userService = require("../services/user.service");
const { sanitizeUser, buildTokenPayload } = require("../utils/userHelpers");
const {
  generateStudentId,
  emptyToNull,
  parseDateOfBirth,
  assertSemesterForYear,
  registrationOptions,
} = require("../utils/studentRegistration");

exports.getRegistrationOptions = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    });

    return res.json({
      success: true,
      ...registrationOptions(departments),
    });
  } catch (error) {
    next(error);
  }
};

exports.registerStudent = async (req, res, next) => {
  try {
    const name = emptyToNull(req.body.name);
    const email = emptyToNull(req.body.email);
    const password = req.body.password;
    const departmentId = Number(req.body.departmentId);
    const program = emptyToNull(req.body.program);
    const rollNo = Number(req.body.rollNo);
    const academicYear = emptyToNull(req.body.academicYear);
    const year = emptyToNull(req.body.year);
    const semester = Number(req.body.semester);
    const division = emptyToNull(req.body.division);

    assertSemesterForYear(year, semester);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      return res.status(422).json({
        success: false,
        message: "Selected department was not found",
      });
    }

    const duplicateRoll = await prisma.studentProfile.findFirst({
      where: {
        departmentId: department.id,
        academicYear,
        year,
        division,
        rollNo,
      },
      select: { id: true },
    });
    if (duplicateRoll) {
      return res.status(409).json({
        success: false,
        message:
          "A student with this roll number already exists for the selected department, year, and division",
      });
    }

    let studentId = generateStudentId();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existingId = await prisma.studentProfile.findUnique({
        where: { studentId },
        select: { id: true },
      });
      if (!existingId) break;
      studentId = generateStudentId();
    }

    const hashedPassword = await hashPassword(password);
    const dateOfBirth = parseDateOfBirth(req.body.dateOfBirth);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "STUDENT",
          status: "PENDING",
        },
      });

      const profile = await tx.studentProfile.create({
        data: {
          userId: user.id,
          studentId,
          rollNo,
          enrollmentNo: null,
          mobileNumber: emptyToNull(req.body.phone || req.body.mobileNumber),
          gender: emptyToNull(req.body.gender),
          enrollmentStatus: "ACTIVE",
          program,
          dateOfBirth,
          bloodGroup: emptyToNull(req.body.bloodGroup),
          nationality: emptyToNull(req.body.nationality),
          fatherName: emptyToNull(req.body.fatherName),
          motherName: emptyToNull(req.body.motherName),
          address: emptyToNull(req.body.address),
          emergencyContactName: emptyToNull(req.body.emergencyContactName),
          emergencyContactRelationship: emptyToNull(req.body.emergencyContactRelationship),
          emergencyContactPhone: emptyToNull(req.body.emergencyContactPhone),
          departmentId: department.id,
          departmentCode: department.code,
          departmentName: department.name,
          academicYear,
          semester,
          division,
          year,
        },
      });

      return { user, profile };
    });

    return res.status(201).json({
      success: true,
      message:
        "Registration submitted. Your account is pending approval by a Coordinator.",
      user: sanitizeUser({
        ...created.user,
        studentProfile: created.profile,
      }),
    });
  } catch (error) {
    if (error.code === "P2002") {
      const target = error.meta?.target || [];
      const message = target.includes("email")
        ? "Email already exists"
        : target.includes("studentId")
          ? "Student ID / GR number already exists"
          : target.includes("enrollmentNo")
            ? "Enrollment number already exists"
            : "A record with this unique value already exists";
      return res.status(409).json({ success: false, message });
    }
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

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect current password",
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
        tokenVersion: { increment: 1 },
      },
      include: {
        studentProfile: { include: { department: true } },
        facultyProfile: { include: { department: true } },
        hodProfile: { include: { department: true } },
        coordinatorProfile: { include: { department: true } },
        adminProfile: true,
      },
    });

    const token = generateToken(buildTokenPayload(updatedUser));

    return res.json({
      success: true,
      message: "Password changed successfully",
      token,
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};
