const prisma = require("../config/prisma");
const userService = require("../services/user.service");
const { hashPassword } = require("../utils/hashPassword");
const { sanitizeUser } = require("../utils/userHelpers");
const studentAttendanceService = require("../services/studentAttendance.service");

// ─── Create Student (Admin / Coordinator can create directly) ─────────────────
exports.createStudent = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      studentId,
      rollNo,
      enrollmentNo,
      mobileNumber,
      departmentCode,
      departmentName,
      academicYear,
      semester,
      division,
      year,
    } = req.body;

    // Create User first
    const user = await userService.createApprovedUser({
      name,
      email,
      password,
      role: "STUDENT",
    });

    // Resolve department (optional FK)
    let departmentId = null;
    if (departmentCode) {
      const dept = await prisma.department.findUnique({
        where: { code: departmentCode.toUpperCase().trim() },
      });
      if (dept) departmentId = dept.id;
    }

    const profile = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        studentId: studentId.trim(),
        rollNo: rollNo ? parseInt(rollNo) : null,
        enrollmentNo: enrollmentNo ? enrollmentNo.trim() : null,
        mobileNumber: mobileNumber || null,
        departmentCode: (departmentCode || "").toUpperCase().trim(),
        departmentName: (departmentName || "").trim(),
        departmentId,
        academicYear: academicYear.trim(),
        semester: parseInt(semester),
        division: division || null,
        year,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      user: sanitizeUser(user),
      profile,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Duplicate value — student ID, enrollment no, or email already exists",
      });
    }
    next(error);
  }
};

// ─── List Students ────────────────────────────────────────────────────────────
exports.listStudents = async (req, res, next) => {
  try {
    const {
      department,
      year,
      semester,
      division,
      academicYear,
      status,
      page = 1,
      limit = 50,
    } = req.query;

    const where = {};
    if (department) where.departmentCode = department.toUpperCase();
    if (year) where.year = year;
    if (semester) where.semester = parseInt(semester);
    if (division) where.division = division.toUpperCase();
    if (academicYear) where.academicYear = academicYear;
    if (status) where.enrollmentStatus = status;

    const [students, total] = await Promise.all([
      prisma.studentProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, status: true, isActive: true },
          },
        },
        orderBy: [{ year: "asc" }, { semester: "asc" }, { rollNo: "asc" }],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.studentProfile.count({ where }),
    ]);

    return res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      students,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Student by ID ────────────────────────────────────────────────────────
exports.getStudent = async (req, res, next) => {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: {
          select: { id: true, name: true, email: true, status: true, isActive: true },
        },
        department: true,
        subjectEnrollments: {
          include: { subject: true },
          where: { status: "ACTIVE" },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.json({ success: true, student });
  } catch (error) {
    next(error);
  }
};

// ─── Get Student by Student ID (GR No) ────────────────────────────────────────
exports.getStudentByStudentId = async (req, res, next) => {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { studentId: req.params.studentId },
      include: {
        user: {
          select: { id: true, name: true, email: true, status: true, isActive: true },
        },
        department: true,
        subjectEnrollments: {
          include: { subject: true },
          where: { status: "ACTIVE" },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.json({ success: true, student });
  } catch (error) {
    next(error);
  }
};

// ─── Update Student ───────────────────────────────────────────────────────────
exports.updateStudent = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const {
      rollNo,
      mobileNumber,
      division,
      semester,
      academicYear,
      year,
      enrollmentStatus,
      departmentCode,
      departmentName,
    } = req.body;

    const data = {};
    if (rollNo !== undefined) data.rollNo = parseInt(rollNo);
    if (mobileNumber !== undefined) data.mobileNumber = mobileNumber;
    if (division !== undefined) data.division = division;
    if (semester !== undefined) data.semester = parseInt(semester);
    if (academicYear !== undefined) data.academicYear = academicYear;
    if (year !== undefined) data.year = year;
    if (enrollmentStatus !== undefined) data.enrollmentStatus = enrollmentStatus;

    // Update department FK if code changed
    if (departmentCode) {
      data.departmentCode = departmentCode.toUpperCase().trim();
      if (departmentName) data.departmentName = departmentName.trim();
      const dept = await prisma.department.findUnique({
        where: { code: departmentCode.toUpperCase().trim() },
      });
      if (dept) data.departmentId = dept.id;
    }

    const profile = await prisma.studentProfile.update({
      where: { id },
      data,
    });

    return res.json({ success: true, profile });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    next(error);
  }
};

// ─── Delete Student ───────────────────────────────────────────────────────────
exports.deleteStudent = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    // Get profile to find associated User
    const profile = await prisma.studentProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Cascade deletes profile via onDelete: Cascade on User
    await prisma.user.delete({ where: { id: profile.userId } });

    return res.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ─── Get Subjects for a Student ───────────────────────────────────────────────
exports.getStudentSubjects = async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const studentId = parseInt(req.params.id);

    const enrollments = await prisma.studentSubjectEnrollment.findMany({
      where: {
        studentId,
        ...(academicYear ? { academicYear } : {}),
      },
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
    });

    return res.json({ success: true, enrollments });
  } catch (error) {
    next(error);
  }
};

// ─── Get Current Authenticated Student Profile ───────────────────────────────
exports.getMyProfile = async (req, res, next) => {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
      select: {
        id: true,
        studentId: true,
        rollNo: true,
        enrollmentNo: true,
        mobileNumber: true,
        gender: true,
        enrollmentStatus: true,
        program: true,
        dateOfBirth: true,
        bloodGroup: true,
        nationality: true,
        fatherName: true,
        motherName: true,
        address: true,
        emergencyContactName: true,
        emergencyContactRelationship: true,
        emergencyContactPhone: true,
        departmentCode: true,
        departmentName: true,
        academicYear: true,
        semester: true,
        division: true,
        year: true,
        department: { select: { code: true, name: true } },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            isActive: true,
            role: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    const user = profile.user;
    const departmentName = profile.department?.name || profile.departmentName || null;
    const departmentCode = profile.department?.code || profile.departmentCode || null;

    return res.json({
      success: true,
      profile: {
        id: profile.id,
        studentId: profile.studentId,
        rollNo: profile.rollNo,
        enrollmentNo: profile.enrollmentNo,
        mobileNumber: profile.mobileNumber,
        gender: profile.gender,
        enrollmentStatus: profile.enrollmentStatus,
        program: profile.program,
        dateOfBirth: profile.dateOfBirth,
        dob: profile.dateOfBirth,
        bloodGroup: profile.bloodGroup,
        nationality: profile.nationality,
        fatherName: profile.fatherName,
        motherName: profile.motherName,
        address: profile.address,
        emergencyContactName: profile.emergencyContactName,
        emergencyContactRelationship: profile.emergencyContactRelationship,
        emergencyContactPhone: profile.emergencyContactPhone,
        emergencyContact: {
          name: profile.emergencyContactName,
          relationship: profile.emergencyContactRelationship,
          phone: profile.emergencyContactPhone,
        },
        departmentCode,
        departmentName,
        academicYear: profile.academicYear,
        semester: profile.semester,
        division: profile.division,
        year: profile.year,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.status,
        isActive: user.isActive,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          isActive: user.isActive,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Current Authenticated Student Subjects ──────────────────────────────
exports.getMySubjects = async (req, res, next) => {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    const enrollments = await prisma.studentSubjectEnrollment.findMany({
      where: { studentId: profile.id },
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
      orderBy: { subject: { subjectCode: "asc" } },
    });

    return res.json({ success: true, enrollments });
  } catch (error) {
    next(error);
  }
};

// ─── Get Current Authenticated Student Dashboard Stats ───────────────────────
exports.getMyDashboard = async (req, res, next) => {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true, academicYear: true, year: true, semester: true, division: true, labBatch: true },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    const [enrolledSubjectsCount, attendance, unreadNotificationCount, registeredUpcomingEvents, enrollments] = await Promise.all([
      prisma.studentSubjectEnrollment.count({
        where: { studentId: profile.id, academicYear: profile.academicYear, status: "ACTIVE" },
      }),
      studentAttendanceService.getStudentAttendanceSummary(req.user.id),
      prisma.studentNotification.count({ where: { recipientId: req.user.id, readAt: null } }),
      prisma.eventRegistration.count({
        where: { studentId: profile.id, status: "REGISTERED", event: { status: "PUBLISHED", startsAt: { gte: new Date() } } },
      }),
      prisma.studentSubjectEnrollment.findMany({
        where: { studentId: profile.id, academicYear: profile.academicYear, status: "ACTIVE" },
        select: { subjectId: true },
      }),
    ]);

    const assignments = enrollments.length ? await prisma.academicAssignment.findMany({
      where: {
        subjectId: { in: enrollments.map((row) => row.subjectId) }, academicYear: profile.academicYear,
        year: profile.year, semester: profile.semester, status: "PUBLISHED",
        OR: [
          { division: null },
          { division: profile.division, OR: [{ labBatch: null }, ...(profile.labBatch ? [{ labBatch: profile.labBatch }] : [])] },
          { division: `Division ${profile.division}`, OR: [{ labBatch: null }, ...(profile.labBatch ? [{ labBatch: profile.labBatch }] : [])] },
        ],
      },
      include: { submissions: { where: { studentId: profile.id }, select: { id: true } } },
    }) : [];
    const pendingAssignmentCount = assignments.filter((assignment) => assignment.submissions.length === 0 && assignment.dueAt >= new Date()).length;

    return res.json({
      success: true,
      data: {
        attendancePercentage: attendance.overallPercentage,
        attendanceStatus: attendance.status,
        enrolledSubjectsCount,
        pendingAssignmentCount,
        unreadNotificationCount,
        registeredUpcomingEvents,
        attendance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Current Authenticated Student Attendance ────────────────────────────
exports.getMyAttendance = async (req, res, next) => {
  try {
    const data = await studentAttendanceService.getStudentAttendanceSummary(req.user.id);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getMyActiveAttendanceSessions = async (req, res, next) => {
  try {
    const sessions = await studentAttendanceService.listActiveSessions(req.user.id);
    return res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

exports.checkInToAttendanceSession = async (req, res, next) => {
  try {
    const result = await studentAttendanceService.checkIn(req.user.id, req.params.id, req.body?.code);
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

