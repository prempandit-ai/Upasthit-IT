import api from "./api";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginRequest = (credentials) =>
  api.post("/api/auth/login", credentials);

export const getMeRequest = () => api.get("/api/auth/me");

// ── Self-registration (public, status: PENDING) ───────────────────────────────
export const registerStudentRequest = (payload) =>
  api.post("/api/auth/register-student", payload);

export const registerFacultyRequest = (payload) =>
  api.post("/api/auth/register-faculty", payload);

// ── RBAC verification routes (for dashboard health check) ─────────────────────
export const verifyRoleRoute = (role) => {
  const routeMap = {
    ADMIN: "/api/auth/admin-only",
    STUDENT: "/api/auth/student-only",
    FACULTY: "/api/auth/faculty-only",
    HOD: "/api/auth/hod-only",
    COORDINATOR: "/api/auth/coordinator-only",
  };

  return api.get(routeMap[role]);
};

// ── Admin API calls ───────────────────────────────────────────────────────────
export const adminCreateHodRequest = (payload) =>
  api.post("/api/admin/create-hod", payload);

export const adminCreateFacultyRequest = (payload) =>
  api.post("/api/admin/create-faculty", payload);

export const adminListUsersRequest = (params) =>
  api.get("/api/admin/users", { params });

export const adminApproveUserRequest = (id) =>
  api.patch(`/api/admin/users/${id}/approve`);

export const adminRejectUserRequest = (id) =>
  api.patch(`/api/admin/users/${id}/reject`);

export const adminDeactivateUserRequest = (id) =>
  api.patch(`/api/admin/users/${id}/deactivate`);

// ── HOD API calls ─────────────────────────────────────────────────────────────
export const hodCreateCoordinatorRequest = (payload) =>
  api.post("/api/hod/create-coordinator", payload);

export const hodListPendingFacultyRequest = () =>
  api.get("/api/hod/pending-faculty");

export const hodApproveFacultyRequest = (id) =>
  api.patch(`/api/hod/faculty/${id}/approve`);

export const hodRejectFacultyRequest = (id) =>
  api.patch(`/api/hod/faculty/${id}/reject`);

// ── Coordinator API calls ─────────────────────────────────────────────────────
export const coordinatorListPendingStudentsRequest = () =>
  api.get("/api/coordinator/pending-students");

export const coordinatorApproveStudentRequest = (id) =>
  api.patch(`/api/coordinator/students/${id}/approve`);

export const coordinatorRejectStudentRequest = (id) =>
  api.patch(`/api/coordinator/students/${id}/reject`);
