const prisma = require("../config/prisma");
const userService = require("../services/user.service");
const { hashPassword } = require("../utils/hashPassword");
const { sanitizeUser } = require("../utils/userHelpers");

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
