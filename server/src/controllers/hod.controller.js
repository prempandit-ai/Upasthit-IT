const prisma = require("../config/prisma");
const userService = require("../services/user.service");
const { sanitizeUser } = require("../utils/userHelpers");

// ─── HOD Dashboard Overview ────────────────────────────────────────────────────
exports.getDepartmentOverview = async (req, res, next) => {
  try {
    const hodProfile = await prisma.hODProfile.findUnique({
      where: { userId: req.user.id },
      include: { department: true },
    });

    if (!hodProfile) {
      return res.status(404).json({ success: false, message: "HOD profile not found" });
    }

    const deptCode = hodProfile.departmentCode;

    const [studentCount, facultyCount, subjectCount, pendingFaculty] = await Promise.all([
      prisma.studentProfile.count({ where: { departmentCode: deptCode } }),
      prisma.facultyProfile.count({ where: { departmentCode: deptCode } }),
      prisma.subject.count({ where: { departmentCode: deptCode } }),
      prisma.user.findMany({
        where: { role: "FACULTY", status: "PENDING" },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
    ]);

    return res.json({
      success: true,
      department: hodProfile.department || { code: deptCode, name: hodProfile.departmentName },
      stats: { studentCount, facultyCount, subjectCount, pendingFacultyCount: pendingFaculty.length },
      pendingFaculty,
    });
  } catch (error) {
    next(error);
  }
};

// ─── List Faculty in HOD's department ─────────────────────────────────────────
exports.listDepartmentFaculty = async (req, res, next) => {
  try {
    const hodProfile = await prisma.hODProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!hodProfile) {
      return res.status(404).json({ success: false, message: "HOD profile not found" });
    }

    const faculty = await prisma.facultyProfile.findMany({
      where: { departmentCode: hodProfile.departmentCode },
      include: {
        user: { select: { id: true, name: true, email: true, status: true, isActive: true } },
        subjectAssignments: { include: { subject: true } },
      },
    });

    return res.json({ success: true, faculty });
  } catch (error) {
    next(error);
  }
};

// ─── Create HOD Profile (called after Admin creates the User) ─────────────────
exports.createHodProfile = async (req, res, next) => {
  try {
    const { userId, employeeId, departmentCode, departmentName } = req.body;

    let departmentId = null;
    if (departmentCode) {
      const dept = await prisma.department.findUnique({
        where: { code: departmentCode.toUpperCase().trim() },
      });
      if (dept) departmentId = dept.id;
    }

    const profile = await prisma.hODProfile.create({
      data: {
        userId,
        employeeId: employeeId.trim(),
        departmentCode: (departmentCode || "").toUpperCase().trim(),
        departmentName: (departmentName || "").trim(),
        departmentId,
      },
    });

    return res.status(201).json({ success: true, profile });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "HOD profile already exists for this user/employeeId",
      });
    }
    next(error);
  }
};

// ─── Create Coordinator (HOD creates both User + Profile) ─────────────────────
exports.createCoordinator = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      employeeId,
      departmentCode,
      departmentName,
    } = req.body;

    const user = await userService.createApprovedUser({
      name,
      email,
      password,
      role: "COORDINATOR",
    });

    let departmentId = null;
    if (departmentCode) {
      const dept = await prisma.department.findUnique({
        where: { code: departmentCode.toUpperCase().trim() },
      });
      if (dept) departmentId = dept.id;
    }

    const profile = await prisma.coordinatorProfile.create({
      data: {
        userId: user.id,
        employeeId: employeeId.trim(),
        departmentCode: (departmentCode || "").toUpperCase().trim(),
        departmentName: (departmentName || "").trim(),
        departmentId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Coordinator account created successfully",
      user: sanitizeUser(user),
      profile,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Employee ID or email already exists",
      });
    }
    next(error);
  }
};

// ─── List Pending Faculty ──────────────────────────────────────────────────────
exports.listPendingFaculty = async (req, res, next) => {
  try {
    const users = await userService.listUsers({ role: "FACULTY", status: "PENDING" });
    return res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// ─── Approve Faculty ───────────────────────────────────────────────────────────
exports.approveFaculty = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, "APPROVED", ["FACULTY"]);

    // Log the approval
    await prisma.approvalLog.create({
      data: {
        targetId: req.params.id,
        reviewerId: req.user.id,
        action: "APPROVED",
        note: req.body.note || null,
      },
    });

    return res.json({
      success: true,
      message: "Faculty approved successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reject Faculty ────────────────────────────────────────────────────────────
exports.rejectFaculty = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, "REJECTED", ["FACULTY"]);

    await prisma.approvalLog.create({
      data: {
        targetId: req.params.id,
        reviewerId: req.user.id,
        action: "REJECTED",
        note: req.body.note || null,
      },
    });

    return res.json({
      success: true,
      message: "Faculty registration rejected",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ─── View Approval History ─────────────────────────────────────────────────────
exports.getApprovalHistory = async (req, res, next) => {
  try {
    const logs = await prisma.approvalLog.findMany({
      where: { reviewerId: req.user.id },
      include: {
        target: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};
