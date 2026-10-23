const prisma = require("../config/prisma");
const userService = require("../services/user.service");
const { sanitizeUser } = require("../utils/userHelpers");
const { BATCHES_BY_DIVISION, normalizeDivision, allocationPreview } = require("../utils/labBatch");

exports.listStudentBatches = async (req, res, next) => {
  try {
    const scope = { academicYear: req.query.academicYear, year: req.query.year, division: req.query.division };
    const [optionsRows, students] = await Promise.all([
      prisma.studentProfile.findMany({
        select: { academicYear: true, year: true },
        distinct: ["academicYear", "year"],
        orderBy: [{ academicYear: "desc" }, { year: "asc" }],
      }),
      scope.academicYear && scope.year && scope.division && BATCHES_BY_DIVISION[normalizeDivision(scope.division)]
        ? prisma.studentProfile.findMany({
            where: {
              academicYear: scope.academicYear,
              year: scope.year,
              OR: [
                { division: { equals: normalizeDivision(scope.division), mode: "insensitive" } },
                { division: { equals: `Div ${normalizeDivision(scope.division)}`, mode: "insensitive" } },
                { division: { equals: `Division ${normalizeDivision(scope.division)}`, mode: "insensitive" } },
                { division: { equals: `Section ${normalizeDivision(scope.division)}`, mode: "insensitive" } },
              ],
            },
            select: {
              id: true,
              studentId: true,
              rollNo: true,
              academicYear: true,
              year: true,
              division: true,
              labBatch: true,
              enrollmentStatus: true,
              departmentCode: true,
              departmentName: true,
              user: { select: { name: true, email: true } },
            },
            orderBy: [{ rollNo: "asc" }, { id: "asc" }],
          })
        : Promise.resolve([]),
    ]);

    const preview = allocationPreview(students);
    const academicYears = [...new Set(optionsRows.map((row) => row.academicYear))];
    const years = [...new Set(optionsRows.map((row) => row.year))];
    return res.json({
      success: true,
      academicYears,
      years,
      divisions: Object.keys(BATCHES_BY_DIVISION),
      batchesByDivision: BATCHES_BY_DIVISION,
      students: preview,
      summary: {
        total: preview.length,
        ready: preview.filter((student) => student.allocationStatus === "READY").length,
        requiringReview: preview.filter((student) => student.allocationStatus !== "READY").length,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStudentBatch = async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "A valid student profile ID is required" });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id },
      select: { id: true, division: true },
    });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const batch = req.body?.labBatch == null || req.body.labBatch === ""
      ? null
      : String(req.body.labBatch).trim().toUpperCase();
    const division = normalizeDivision(student.division);
    if (batch && !BATCHES_BY_DIVISION[division]?.includes(batch)) {
      return res.status(400).json({ success: false, message: `Select a valid batch for Division ${division || "A or B"}` });
    }

    const updated = await prisma.studentProfile.update({
      where: { id },
      data: { labBatch: batch },
      select: { id: true, studentId: true, labBatch: true },
    });
    return res.json({ success: true, student: updated });
  } catch (error) {
    next(error);
  }
};

// ─── List Pending Students ─────────────────────────────────────────────────────
exports.listPendingStudents = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "STUDENT", status: "PENDING" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isActive: true,
        createdAt: true,
        studentProfile: {
          select: {
            studentId: true,
            rollNo: true,
            program: true,
            year: true,
            semester: true,
            division: true,
            academicYear: true,
            departmentCode: true,
            departmentName: true,
            mobileNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
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
