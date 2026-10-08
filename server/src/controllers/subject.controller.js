const prisma = require("../config/prisma");

// ─── Create Subject ────────────────────────────────────────────────────────────
exports.createSubject = async (req, res, next) => {
  try {
    const {
      subjectCode,
      subjectName,
      subjectType,
      credits,
      departmentCode,
      academicYear,
      semester,
      year,
    } = req.body;

    let departmentId = null;
    if (departmentCode) {
      const dept = await prisma.department.findUnique({
        where: { code: departmentCode.toUpperCase().trim() },
      });
      if (dept) departmentId = dept.id;
    }

    const subject = await prisma.subject.create({
      data: {
        subjectCode: subjectCode.trim().toUpperCase(),
        subjectName: subjectName.trim(),
        subjectType: subjectType || "THEORY",
        credits: credits ? parseInt(credits) : null,
        departmentCode: (departmentCode || "").toUpperCase().trim(),
        departmentId,
        academicYear: academicYear.trim(),
        semester: parseInt(semester),
        year,
      },
    });

    return res.status(201).json({ success: true, subject });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Subject code already exists",
      });
    }
    next(error);
  }
};

// ─── List Subjects ─────────────────────────────────────────────────────────────
exports.listSubjects = async (req, res, next) => {
  try {
    const { department, semester, year, academicYear, page = 1, limit = 100 } = req.query;

    const where = {};
    if (department) where.departmentCode = department.toUpperCase();
    if (semester) where.semester = parseInt(semester);
    if (year) where.year = year;
    if (academicYear) where.academicYear = academicYear;

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        include: {
          department: true,
          _count: {
            select: {
              facultyAssignments: true,
              studentEnrollments: true,
            },
          },
        },
        orderBy: [{ semester: "asc" }, { subjectCode: "asc" }],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.subject.count({ where }),
    ]);

    return res.json({ success: true, total, subjects });
  } catch (error) {
    next(error);
  }
};

// ─── Get Subject by ID ─────────────────────────────────────────────────────────
exports.getSubject = async (req, res, next) => {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        department: true,
        facultyAssignments: {
          include: {
            faculty: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
        _count: { select: { studentEnrollments: true } },
      },
    });

    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    return res.json({ success: true, subject });
  } catch (error) {
    next(error);
  }
};

// ─── Update Subject ────────────────────────────────────────────────────────────
exports.updateSubject = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { subjectName, subjectType, credits, academicYear, semester, year } = req.body;

    const data = {};
    if (subjectName !== undefined) data.subjectName = subjectName.trim();
    if (subjectType !== undefined) data.subjectType = subjectType;
    if (credits !== undefined) data.credits = parseInt(credits);
    if (academicYear !== undefined) data.academicYear = academicYear.trim();
    if (semester !== undefined) data.semester = parseInt(semester);
    if (year !== undefined) data.year = year;

    const subject = await prisma.subject.update({ where: { id }, data });
    return res.json({ success: true, subject });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }
    next(error);
  }
};

// ─── Delete Subject ────────────────────────────────────────────────────────────
exports.deleteSubject = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            facultyAssignments: true,
            studentEnrollments: true,
          },
        },
      },
    });

    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    const total = subject._count.facultyAssignments + subject._count.studentEnrollments;
    if (total > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete subject — it has ${subject._count.facultyAssignments} faculty assignments and ${subject._count.studentEnrollments} student enrollments. Remove them first.`,
      });
    }

    await prisma.subject.delete({ where: { id } });
    return res.json({ success: true, message: "Subject deleted" });
  } catch (error) {
    next(error);
  }
};

// ─── Get Students Enrolled in a Subject ───────────────────────────────────────
exports.getEnrolledStudents = async (req, res, next) => {
  try {
    const subjectId = parseInt(req.params.id);
    const { academicYear } = req.query;

    const enrollments = await prisma.studentSubjectEnrollment.findMany({
      where: {
        subjectId,
        ...(academicYear ? { academicYear } : {}),
        status: "ACTIVE",
      },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { student: { rollNo: "asc" } },
    });

    return res.json({ success: true, total: enrollments.length, enrollments });
  } catch (error) {
    next(error);
  }
};

// ─── Enroll Student in Subject ─────────────────────────────────────────────────
exports.enrollStudent = async (req, res, next) => {
  try {
    const subjectId = parseInt(req.params.id);
    const { studentId, academicYear } = req.body;

    // Validate both exist
    const [subject, student] = await Promise.all([
      prisma.subject.findUnique({ where: { id: subjectId } }),
      prisma.studentProfile.findUnique({ where: { id: parseInt(studentId) } }),
    ]);

    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const enrollment = await prisma.studentSubjectEnrollment.create({
      data: {
        studentId: parseInt(studentId),
        subjectId,
        academicYear: academicYear.trim(),
      },
      include: { subject: true, student: true },
    });

    return res.status(201).json({ success: true, enrollment });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Student is already enrolled in this subject for this academic year",
      });
    }
    next(error);
  }
};

// ─── Remove Student Enrollment ─────────────────────────────────────────────────
exports.removeEnrollment = async (req, res, next) => {
  try {
    const enrollmentId = parseInt(req.params.enrollmentId);
    await prisma.studentSubjectEnrollment.delete({ where: { id: enrollmentId } });
    return res.json({ success: true, message: "Enrollment removed" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }
    next(error);
  }
};
