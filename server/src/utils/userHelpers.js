const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

const buildTokenPayload = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  status: user.status,
});

module.exports = {
  sanitizeUser,
  buildTokenPayload,
};
