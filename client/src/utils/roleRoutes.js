export const ROLE_DASHBOARD_PATHS = {
  ADMIN: "/dashboard/admin",
  STUDENT: "/dashboard/student",
  FACULTY: "/dashboard/faculty",
  HOD: "/dashboard/hod",
  COORDINATOR: "/dashboard/coordinator",
};

export const ROLE_LABELS = {
  ADMIN: "Administrator",
  STUDENT: "Student",
  FACULTY: "Faculty",
  HOD: "Head of Department",
  COORDINATOR: "Coordinator",
};

export const getDashboardPathForRole = (role) =>
  ROLE_DASHBOARD_PATHS[role] || "/unauthorized";

export const ROLE_NAV_ITEMS = {
  ADMIN: [
    { label: "User Management", href: "#users" },
    { label: "Create HOD", href: "#create-hod" },
    { label: "Create Faculty", href: "#create-faculty" },
  ],
  STUDENT: [
    { label: "Attendance", href: "#attendance" },
    { label: "Leave", href: "#leave" },
    { label: "Assignments", href: "#assignments" },
  ],
  FACULTY: [
    { label: "Mark Attendance", href: "#mark-attendance" },
    { label: "Students", href: "#students" },
    { label: "Assignments", href: "#assignments" },
  ],
  HOD: [
    { label: "Dashboard", href: "/dashboard/hod" },
    { label: "Department Overview", href: "/dashboard/hod/department" },
    { label: "OP Requests", href: "/dashboard/hod/op" },
    { label: "Faculty Management", href: "/dashboard/hod/faculty" },
    { label: "Access Audit Log", href: "/dashboard/hod/audit" },
    { label: "Faculty Attendance", href: "/dashboard/hod/faculty-attendance" },
    { label: "Reports", href: "/dashboard/hod/reports" },
  ],
  COORDINATOR: [
    { label: "Dashboard", href: "/dashboard/coordinator" },
    { label: "Events", href: "/dashboard/coordinator/events" },
    { label: "Participants", href: "/dashboard/coordinator/participants" },
    { label: "Faculty Management", href: "/dashboard/coordinator/faculty" },
    { label: "Attendance Mapping", href: "/dashboard/coordinator/attendance-mapping" },
    { label: "Reports", href: "/dashboard/coordinator/reports" },
  ],
};

