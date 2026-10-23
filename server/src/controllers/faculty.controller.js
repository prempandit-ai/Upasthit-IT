const prisma = require("../config/prisma");
const { classifyFaculty, facultyClassificationWhere } = require("../config/facultyClassification");
const userService = require("../services/user.service");
const { sanitizeUser } = require("../utils/userHelpers");

// ─── Create Faculty Profile (link to existing approved User) ──────────────────
exports.createFaculty = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      employeeId,
      mobileNumber,
      designation,
      departmentCode,
      departmentName,
    } = req.body;

    const user = await userService.createApprovedUser({
      name,
      email,
      password,
      role: "FACULTY",
    });

    let departmentId = null;
    if (departmentCode) {
      const dept = await prisma.department.findUnique({
        where: { code: departmentCode.toUpperCase().trim() },
      });
      if (dept) departmentId = dept.id;
    }

    const profile = await prisma.facultyProfile.create({
      data: {
        userId: user.id,
        employeeId: employeeId.trim(),
        mobileNumber: mobileNumber || null,
        designation: designation || null,
        departmentCode: (departmentCode || "").toUpperCase().trim(),
        departmentName: (departmentName || "").trim(),
        departmentId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Faculty created successfully",
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

// ─── List Faculty ─────────────────────────────────────────────────────────────
exports.listFaculty = async (req, res, next) => {
  try {
    const { department, page = 1, limit = 50, classification = "current" } = req.query;
    if (!["current", "historical", "all"].includes(classification)) {
      return res.status(400).json({ success: false, message: "Invalid faculty classification" });
    }

    const where = facultyClassificationWhere(classification);
    if (department) where.department = { code: department.toUpperCase() };

    const [faculty, total] = await Promise.all([
      prisma.facultyProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, status: true, isActive: true },
          },
          department: true,
        },
        orderBy: { employeeId: "asc" },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.facultyProfile.count({ where }),
    ]);

    return res.json({ success: true, total, faculty: faculty.map((item) => ({ ...item, classification: classifyFaculty(item.employeeId) })) });
  } catch (error) {
    next(error);
  }
};

// ─── Get Faculty by ID ────────────────────────────────────────────────────────
exports.getFaculty = async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id);
    const roles = req.user.roles || [req.user.role];
    const canManageFaculty = ["ADMIN", "HOD", "COORDINATOR"].some((role) =>
      roles.includes(role)
    );

    // If caller is FACULTY, ensure they can only access their own profile
    if (!canManageFaculty && roles.includes("FACULTY")) {
      const myProfile = await prisma.facultyProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!myProfile || myProfile.id !== targetId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You are not authorized to view another faculty member's profile",
        });
      }
    }

    const faculty = await prisma.facultyProfile.findUnique({
      where: { id: targetId },
      include: {
        user: {
          select: { id: true, name: true, email: true, status: true, isActive: true },
        },
        department: true,
        subjectAssignments: {
          include: { subject: true },
        },
      },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    return res.json({ success: true, faculty });
  } catch (error) {
    next(error);
  }
};

// ─── Update Faculty ───────────────────────────────────────────────────────────
exports.updateFaculty = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { mobileNumber, designation, departmentCode, departmentName } = req.body;

    const data = {};
    if (mobileNumber !== undefined) data.mobileNumber = mobileNumber;
    if (designation !== undefined) data.designation = designation;
    if (departmentCode) {
      data.departmentCode = departmentCode.toUpperCase().trim();
      if (departmentName) data.departmentName = departmentName.trim();
      const dept = await prisma.department.findUnique({
        where: { code: departmentCode.toUpperCase().trim() },
      });
      if (dept) data.departmentId = dept.id;
    }

    const profile = await prisma.facultyProfile.update({ where: { id }, data });
    return res.json({ success: true, profile });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }
    next(error);
  }
};

// ─── Assign Faculty to Subject ────────────────────────────────────────────────
exports.assignSubject = async (req, res, next) => {
  try {
    const facultyId = Number(req.params.id);
    const subjectId = Number(req.body?.subjectId);
    const academicYear =
      typeof req.body?.academicYear === "string"
        ? req.body.academicYear.trim()
        : "";
    const rawDivision = req.body?.division;

    if (!Number.isInteger(facultyId) || facultyId <= 0) {
      return res.status(400).json({ success: false, message: "A valid faculty ID is required" });
    }
    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      return res.status(400).json({ success: false, message: "A valid subject ID is required" });
    }
    if (!academicYear) {
      return res.status(400).json({ success: false, message: "Academic year is required" });
    }

    let division = null;
    if (rawDivision !== null && rawDivision !== undefined && rawDivision !== "") {
      if (typeof rawDivision !== "string") {
        return res.status(400).json({ success: false, message: "Division must be a letter such as A or B" });
      }
      division = rawDivision.trim().toUpperCase();
      if (!/^[A-Z]$/.test(division)) {
        return res.status(400).json({ success: false, message: "Division must be a letter such as A or B" });
      }
    }

    // Validate faculty exists
    const faculty = await prisma.facultyProfile.findUnique({ where: { id: facultyId } });
    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    // Validate subject exists
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    if (academicYear !== subject.academicYear) {
      return res.status(400).json({
        success: false,
        message: `Academic year must match the selected subject (${subject.academicYear})`,
      });
    }

    // NULL divisions mean "all divisions" and are not considered equal by a
    // PostgreSQL composite unique constraint. Check for overlapping scopes in
    // a serializable transaction so repeated requests cannot create duplicates.
    const assignment = await prisma.$transaction(async (tx) => {
      const existingAssignments = await tx.facultySubjectAssignment.findMany({
        where: { facultyId, subjectId, academicYear },
        select: { id: true, division: true },
      });
      const overlapsExisting = existingAssignments.some(
        (existing) =>
          existing.division === null ||
          division === null ||
          existing.division === division
      );

      if (overlapsExisting) return null;

      return tx.facultySubjectAssignment.create({
        data: { facultyId, subjectId, academicYear, division },
        include: { subject: true },
      });
    }, { isolationLevel: "Serializable" });

    if (!assignment) {
      return res.status(409).json({
        success: false,
        message: "Faculty already has an overlapping assignment for this subject and academic year",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Subject assigned successfully",
      assignment,
    });
  } catch (error) {
    if (error.code === "P2002" || error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message: "This subject assignment already exists or conflicts with another request",
      });
    }
    next(error);
  }
};

// ─── Remove Faculty–Subject Assignment ───────────────────────────────────────
exports.removeSubjectAssignment = async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId);
    await prisma.facultySubjectAssignment.delete({ where: { id: assignmentId } });
    return res.json({ success: true, message: "Assignment removed" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }
    next(error);
  }
};

// ─── Get Assigned Subjects ─────────────────────────────────────────────────────
exports.getAssignedSubjects = async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const facultyId = parseInt(req.params.id);

    const roles = req.user.roles || [req.user.role];
    const canManageFaculty = ["ADMIN", "HOD", "COORDINATOR"].some((role) =>
      roles.includes(role)
    );

    // Faculty-only users may view assignments for their own profile.
    if (!canManageFaculty && roles.includes("FACULTY")) {
      const myProfile = await prisma.facultyProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!myProfile || myProfile.id !== facultyId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You are not authorized to view another faculty member's subjects",
        });
      }
    }

    const assignments = await prisma.facultySubjectAssignment.findMany({
      where: {
        facultyId,
        ...(academicYear ? { academicYear } : {}),
      },
      include: {
        subject: {
          include: { department: true },
        },
      },
    });

    return res.json({ success: true, assignments });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Faculty ───────────────────────────────────────────────────────────
exports.deleteFaculty = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const profile = await prisma.facultyProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    await prisma.user.delete({ where: { id: profile.userId } });
    return res.json({ success: true, message: "Faculty deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ─── Get Current Authenticated Faculty Profile ───────────────────────────────
exports.getMyProfile = async (req, res, next) => {
  try {
    const faculty = await prisma.facultyProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, status: true, isActive: true, role: true },
        },
        department: true,
        subjectAssignments: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty profile not found" });
    }

    return res.json({ success: true, faculty });
  } catch (error) {
    next(error);
  }
};

// ─── Get Current Authenticated Faculty Dashboard Stats ───────────────────────
exports.getMyDashboard = async (req, res, next) => {
  try {
    const faculty = await prisma.facultyProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        subjectAssignments: {
          include: { subject: true },
        },
      },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty profile not found" });
    }

    const assignments = faculty.subjectAssignments || [];
    const divisions = Array.from(new Set(assignments.map((a) => a.division).filter(Boolean)));
    const academicYears = Array.from(new Set(assignments.map((a) => a.academicYear).filter(Boolean)));

    const pendingAttendance = await prisma.attendanceSession.count({
      where: { assignment: { facultyId: faculty.id }, status: "ACTIVE", expiresAt: { gt: new Date() } },
    });
    return res.json({
      success: true,
      todayClasses: null,
      scheduleAvailable: false,
      pendingAttendance,
      leaveRequests: null,
      upcomingEvents: null,
      totalSubjects: assignments.length,
      assignedDivisions: divisions.join(", ") || "Not confirmed",
      academicYear: academicYears.join(", ") || null,
      assignments: assignments.map((assignment) => ({
        id: assignment.id,
        academicYear: assignment.academicYear,
        division: assignment.division,
        subject: {
          id: assignment.subject.id,
          subjectCode: assignment.subject.subjectCode,
          subjectName: assignment.subject.subjectName,
          subjectType: assignment.subject.subjectType,
          semester: assignment.subject.semester,
          year: assignment.subject.year,
          departmentCode: assignment.subject.departmentCode,
        },
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Current Authenticated Faculty Today Classes ─────────────────────────
exports.getMyTodayClasses = async (req, res, next) => {
  try {
    const faculty = await prisma.facultyProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        department: true,
        subjectAssignments: {
          include: { subject: true },
        },
      },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty profile not found" });
    }

    // Teaching assignments are not timetable records. No schedule model exists.
    return res.json({ success: true, classes: [], scheduleAvailable: false });

  } catch (error) {
    next(error);
  }
};

// ─── Get Current Authenticated Faculty Today Schedule ────────────────────────
exports.getMyTodaySchedule = async (req, res, next) => {
  try {
    const faculty = await prisma.facultyProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        subjectAssignments: {
          include: { subject: true },
        },
      },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty profile not found" });
    }

    return res.json({ success: true, schedule: [], scheduleAvailable: false });

  } catch (error) {
    next(error);
  }
};

// ─── Get Current Authenticated Faculty Notifications ─────────────────────────
exports.getMyNotifications = async (req, res, next) => {
  try {
    return res.json({ success: true, notifications: [], notificationsAvailable: false });

  } catch (error) {
    next(error);
  }
};

// ─── Get Current Authenticated Faculty Attendance Summary ────────────────────
exports.getMyAttendanceSummary = async (req, res, next) => {
  try {
    const faculty = await prisma.facultyProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        subjectAssignments: {
          include: { subject: true },
        },
      },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty profile not found" });
    }

    // Session dates are grouped by the college's Asia/Kolkata calendar day.
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());
    const start = new Date(today + "T00:00:00+05:30");
    const end = new Date(start.getTime() + 86400000);
    const sessions = await prisma.attendanceSession.findMany({
      where: { assignment: { facultyId: faculty.id }, sessionDate: { gte: start, lt: end },
        status: { in: ["ACTIVE", "COMPLETED"] } },
      include: { assignment: { include: { subject: true } },
        records: { select: { status: true } } },
      orderBy: { sessionDate: "asc" },
    });
    const classes = sessions.map((session) => ({
      id: session.id,
      subject: session.assignment.subject.subjectName,
      classGroup: session.division ? "Division " + session.division : "Division not confirmed",
      status: session.records.length ? "SUBMITTED" : "PENDING",
      present: session.records.filter((record) => record.status === "PRESENT").length,
      total: session.records.length,
    }));
    const submitted = classes.filter((item) => item.status === "SUBMITTED").length;
    const total = classes.reduce((sum, item) => sum + item.total, 0);
    const present = classes.reduce((sum, item) => sum + item.present, 0);
    return res.json({ success: true, classes, summary: {
      conducted: sessions.length, submitted, pending: sessions.length - submitted,
      averagePct: total ? Math.round(present * 100 / total) : null,
    } });

  } catch (error) {
    next(error);
  }
};

