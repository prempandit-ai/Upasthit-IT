const prisma = require("../config/prisma");
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
    const { department, page = 1, limit = 50 } = req.query;

    const where = {};
    if (department) where.departmentCode = department.toUpperCase();

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

    return res.json({ success: true, total, faculty });
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

    return res.json({
      success: true,
      todayClasses: assignments.length,
      pendingAttendance: 1,
      leaveRequests: 0,
      upcomingEvents: 2,
      totalSubjects: assignments.length,
      assignedDivisions: divisions.join(", ") || "All Divisions",
      academicYear: academicYears[0] || "2025-26",
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
      select: { id: true },
    });
    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty profile not found" });
    }
    const dayOfWeek = ((new Date().getDay() + 6) % 7) + 1;
    const entries = await prisma.timetableEntry.findMany({
      where: { facultyId: faculty.id, dayOfWeek },
      include: { subject: true }, orderBy: { startTime: "asc" },
    });
    const now = new Date().toTimeString().slice(0, 5);
    const classes = entries.map((entry) => {
      const status = now < entry.startTime ? "UPCOMING" : now < entry.endTime ? "ONGOING" : "COMPLETED";
      return {
        id: entry.id,
        subject: `${entry.subject.subjectCode} - ${entry.subject.subjectName}`,
        subjectCode: entry.subject.subjectCode,
        startTime: entry.startTime,
        endTime: entry.endTime,
        className: `${entry.subject.departmentCode} Engineering`,
        semester: `Semester ${entry.semester}`,
        division: `Division ${entry.division}`,
        room: entry.room,
        type: entry.sessionType,
        labBatch: entry.labBatch,
        attendanceStatus: status,
        academicYear: entry.academicYear,
      };
    });
    return res.json({ success: true, classes });
  } catch (error) {
    next(error);
  }
};

// ─── Get Current Authenticated Faculty Today Schedule ────────────────────────
exports.getMyTodaySchedule = async (req, res, next) => {
  try {
    const faculty = await prisma.facultyProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });
    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty profile not found" });
    }
    const dayOfWeek = ((new Date().getDay() + 6) % 7) + 1;
    const entries = await prisma.timetableEntry.findMany({
      where: { facultyId: faculty.id, dayOfWeek },
      include: { subject: true }, orderBy: { startTime: "asc" },
    });
    const schedule = entries.map((entry) => {
      const now = new Date().toTimeString().slice(0, 5);
      return {
        id: entry.id,
        startTime: entry.startTime,
        endTime: entry.endTime,
        subject: entry.subject.subjectName,
        subjectCode: entry.subject.subjectCode,
        classGroup: `${entry.year} Div ${entry.division} (Sem ${entry.semester})${entry.labBatch ? ` · ${entry.labBatch}` : ""}`,
        room: entry.room,
        sessionType: entry.sessionType,
        labBatch: entry.labBatch,
        academicYear: entry.academicYear,
        status: now < entry.startTime ? "Upcoming" : now < entry.endTime ? "Ongoing" : "Completed",
      };
    });
    return res.json({ success: true, schedule });
  } catch (error) {
    next(error);
  }
};

// ─── Get Current Authenticated Faculty Notifications ─────────────────────────
exports.getMyNotifications = async (req, res, next) => {
  try {
    const records = await prisma.studentNotification.findMany({ where: { recipientId: req.user.id }, orderBy: { createdAt: "desc" }, take: 100 });
    const notifications = records.map((record) => ({
      id: record.id, title: record.title, body: record.body,
      createdAt: record.createdAt, unread: record.readAt === null,
    }));
    return res.json({ success: true, notifications });
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

    const classes = (faculty.subjectAssignments || []).map((a) => {
      const sub = a.subject;
      return {
        id: a.id,
        subject: sub.subjectName,
        subjectCode: sub.subjectCode,
        batch: `${sub.year || "TY"} Div ${a.division || "A"}`,
        totalStudents: 60,
        presentCount: 54,
        attendanceRate: 90,
      };
    });

    const summary = {
      overallAttendance: 90,
      totalClassesConducted: classes.length * 12,
      pendingSubmissions: 1,
    };

    return res.json({ success: true, summary, classes });
  } catch (error) {
    next(error);
  }
};

