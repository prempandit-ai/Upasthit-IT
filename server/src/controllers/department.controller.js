const prisma = require("../config/prisma");

// ─── Create Department ────────────────────────────────────────────────────────
exports.createDepartment = async (req, res, next) => {
  try {
    const { code, name } = req.body;

    const dept = await prisma.department.create({
      data: { code: code.toUpperCase().trim(), name: name.trim() },
    });

    return res.status(201).json({ success: true, department: dept });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ success: false, message: "Department code already exists" });
    }
    next(error);
  }
};

// ─── List Departments ─────────────────────────────────────────────────────────
exports.listDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { code: "asc" },
    });
    return res.json({ success: true, departments });
  } catch (error) {
    next(error);
  }
};

// ─── Get Department by ID ─────────────────────────────────────────────────────
exports.getDepartment = async (req, res, next) => {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        _count: {
          select: {
            students: true,
            faculty: true,
            subjects: true,
          },
        },
      },
    });

    if (!dept) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    return res.json({ success: true, department: dept });
  } catch (error) {
    next(error);
  }
};

// ─── Update Department ────────────────────────────────────────────────────────
exports.updateDepartment = async (req, res, next) => {
  try {
    const { name } = req.body;
    const dept = await prisma.department.update({
      where: { id: parseInt(req.params.id) },
      data: { name: name.trim() },
    });
    return res.json({ success: true, department: dept });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }
    next(error);
  }
};

// ─── Delete Department ────────────────────────────────────────────────────────
exports.deleteDepartment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    // Check if anything is using this department
    const usage = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: true, faculty: true, subjects: true },
        },
      },
    });

    if (!usage) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    const total =
      usage._count.students + usage._count.faculty + usage._count.subjects;
    if (total > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete department — it has ${usage._count.students} students, ${usage._count.faculty} faculty, and ${usage._count.subjects} subjects linked to it.`,
      });
    }

    await prisma.department.delete({ where: { id } });
    return res.json({ success: true, message: "Department deleted" });
  } catch (error) {
    next(error);
  }
};
