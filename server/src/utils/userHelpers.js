const sanitizeUser = (user) => {
  const profile =
    user.studentProfile ||
    user.facultyProfile ||
    user.hodProfile ||
    user.coordinatorProfile ||
    user.adminProfile ||
    null;

  const base = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isActive: user.isActive,
    mustChangePassword: Boolean(user.mustChangePassword),
    profile,
    createdAt: user.createdAt,
  };

  if (user.facultyProfile) {
    base.employeeId = user.facultyProfile.employeeId;
    base.designation = user.facultyProfile.designation;
    base.department =
      user.facultyProfile.department?.name ||
      user.facultyProfile.departmentName ||
      user.facultyProfile.departmentCode;
    base.departmentCode =
      user.facultyProfile.department?.code || user.facultyProfile.departmentCode;
    base.mobileNumber = user.facultyProfile.mobileNumber;
  } else if (user.studentProfile) {
    base.studentId = user.studentProfile.studentId;
    base.rollNo = user.studentProfile.rollNo;
    base.enrollmentNo = user.studentProfile.enrollmentNo;
    base.department =
      user.studentProfile.department?.name || user.studentProfile.departmentName;
    base.departmentCode =
      user.studentProfile.department?.code || user.studentProfile.departmentCode;
  } else if (user.hodProfile) {
    base.employeeId = user.hodProfile.employeeId;
    base.department =
      user.hodProfile.department?.name || user.hodProfile.departmentName;
  } else if (user.coordinatorProfile) {
    base.employeeId = user.coordinatorProfile.employeeId;
    base.department =
      user.coordinatorProfile.department?.name || user.coordinatorProfile.departmentName;
  } else if (user.adminProfile) {
    base.employeeId = user.adminProfile.employeeId;
  }

  return base;
};

const buildTokenPayload = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  status: user.status,
  tokenVersion: user.tokenVersion ?? 0,
});

module.exports = {
  sanitizeUser,
  buildTokenPayload,
};
