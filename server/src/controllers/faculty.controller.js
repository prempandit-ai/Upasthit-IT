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

    // If caller is FACULTY, ensure they can only access their own profile
    if (req.user.role === "FACULTY") {
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
    const facultyId = parseInt(req.params.id);
    const { subjectId, academicYear, division } = req.body;

    // Validate faculty exists
    const faculty = await prisma.facultyProfile.findUnique({ where: { id: facultyId } });
    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    // Validate subject exists
    const subject = await prisma.subject.findUnique({ where: { id: parseInt(subjectId) } });
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    const assignment = await prisma.facultySubjectAssignment.create({
      data: {
        facultyId,
        subjectId: parseInt(subjectId),
        academicYear: academicYear.trim(),
        division: division ? division.toUpperCase().trim() : null,
      },
      include: { subject: true },
    });

    return res.status(201).json({ success: true, assignment });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Faculty is already assigned to this subject for this year/division",
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

    // If caller is FACULTY, ensure they can only access their own subjects
    if (req.user.role === "FACULTY") {
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

    const times = [
      { start: "10:00 AM", end: "11:00 AM" },
      { start: "11:30 AM", end: "01:00 PM" },
      { start: "02:00 PM", end: "03:00 PM" },
      { start: "03:15 PM", end: "04:15 PM" },
    ];
    const rooms = ["LH-301", "Lab 2", "LH-302", "LH-305"];
    const statuses = ["UPCOMING", "PENDING", "COMPLETED", "UPCOMING"];

    const classes = (faculty.subjectAssignments || []).map((assignment, idx) => {
      const sub = assignment.subject;
      const t = times[idx] || { start: "10:00 AM", end: "11:00 AM" };
      return {
        id: assignment.id,
        subject: `${sub.subjectCode} - ${sub.subjectName}`,
        subjectCode: sub.subjectCode,
        startTime: t.start,
        endTime: t.end,
        className: `${sub.departmentCode || faculty.department?.code || "IT"} Engineering`,
        semester: `Semester ${sub.semester}`,
        division: `Division ${assignment.division || "A"}`,
        room: rooms[idx] || (sub.subjectType === "PRACTICAL" ? "Lab 2" : "LH-301"),
        attendanceStatus: statuses[idx] || "UPCOMING",
        academicYear: assignment.academicYear,
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
      include: {
        subjectAssignments: {
          include: { subject: true },
        },
      },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty profile not found" });
    }

    const times = [
      { start: "10:00 AM", end: "11:00 AM" },
      { start: "11:30 AM", end: "01:00 PM" },
      { start: "02:00 PM", end: "03:00 PM" },
    ];

    const schedule = (faculty.subjectAssignments || []).map((assignment, idx) => {
      const sub = assignment.subject;
      const t = times[idx] || { start: "10:00 AM", end: "11:00 AM" };
      return {
        startTime: t.start,
        endTime: t.end,
        subject: sub.subjectName,
        classGroup: `${sub.year || "TY"} Div ${assignment.division || "A"} (Sem ${sub.semester})`,
        room: sub.subjectType === "PRACTICAL" ? "Lab 2" : "LH-301",
        status: idx === 0 ? "Upcoming" : "Upcoming",
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
    const notifications = [
      {
        id: "notif-1",
        title: "Mid-Term Exam Evaluation Schedule",
        body: "All department faculty must submit mid-term evaluation rubrics by Friday.",
        createdAt: "2 hours ago",
        unread: true,
      },
      {
        id: "notif-2",
        title: "Department Meeting Notice",
        body: "HOD convened an academic audit meeting for upcoming NBA accreditation.",
        createdAt: "Yesterday",
        unread: false,
      },
    ];
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

