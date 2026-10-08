const prisma = require("../config/prisma");
const { hashPassword } = require("../utils/hashPassword");
const { sanitizeUser } = require("../utils/userHelpers");

const createApprovedUser = async ({ name, email, password, role }) => {
  const userExists = await prisma.user.findUnique({ where: { email } });

  if (userExists) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      status: "APPROVED",
    },
  });
};

const createPendingUser = async ({ name, email, password, role }) => {
  const userExists = await prisma.user.findUnique({ where: { email } });

  if (userExists) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      status: "PENDING",
    },
  });
};

const listUsers = async ({ role, status }) => {
  const where = {};

  if (role) where.role = role;
  if (status) where.status = status;

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

const updateUserStatus = async (userId, status, allowedRoles = null) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const error = new Error("You cannot manage this user role");
    error.statusCode = 403;
    throw error;
  }

  if (user.status !== "PENDING") {
    const error = new Error("Only pending accounts can be approved or rejected");
    error.statusCode = 400;
    throw error;
  }

  return prisma.user.update({
    where: { id: userId },
    data: { status },
  });
};

module.exports = {
  createApprovedUser,
  createPendingUser,
  listUsers,
  updateUserStatus,
  sanitizeUser,
};
