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
    const faculty = await prisma.facultyProfile.findUnique({
      where: { id: parseInt(req.params.id) },
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
