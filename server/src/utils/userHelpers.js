const sanitizeUser = (user) => {
  const profile =
    user.studentProfile ||
    user.facultyProfile ||
    user.hodProfile ||
    user.coordinatorProfile ||
    user.adminProfile ||
    null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isActive: user.isActive,
    profile,
    createdAt: user.createdAt,
  };
};

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
