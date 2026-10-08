const prisma = require("../config/prisma");
const userService = require("../services/user.service");
const { sanitizeUser } = require("../utils/userHelpers");

// ─── List Pending Students ─────────────────────────────────────────────────────
exports.listPendingStudents = async (req, res, next) => {
  try {
    const users = await userService.listUsers({ role: "STUDENT", status: "PENDING" });
    return res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// ─── Approve Student ───────────────────────────────────────────────────────────
exports.approveStudent = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, "APPROVED", ["STUDENT"]);

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
      message: "Student approved successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reject Student ────────────────────────────────────────────────────────────
exports.rejectStudent = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, "REJECTED", ["STUDENT"]);

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
      message: "Student registration rejected",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Coordinator Dashboard Overview ───────────────────────────────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalStudents,
      pendingStudents,
      totalSubjects,
      totalFaculty,
    ] = await Promise.all([
      prisma.studentProfile.count(),
      prisma.user.count({ where: { role: "STUDENT", status: "PENDING" } }),
      prisma.subject.count(),
      prisma.facultyProfile.count(),
    ]);

    return res.json({
      success: true,
      stats: { totalStudents, pendingStudents, totalSubjects, totalFaculty },
    });
  } catch (error) {
    next(error);
  }
};

// ─── View Approval History ────────────────────────────────────────────────────
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
