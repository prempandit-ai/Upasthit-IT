/**
 * Faculty API service layer — complete module coverage.
 * All endpoints are ready for backend implementation.
 * The UI handles 404/errors gracefully with empty states.
 */
import api from './api';

// ── Profile / Dashboard ───────────────────────────────────────────────────────
export const getFacultyProfile = () => api.get('/api/faculty/me');
export const getFacultyDashboardStats = () => api.get('/api/faculty/dashboard');

// ── Today's classes ───────────────────────────────────────────────────────────
export const getTodayClasses = () => api.get('/api/faculty/today-classes');

// ── Schedule ──────────────────────────────────────────────────────────────────
export const getTodaySchedule = () => api.get('/api/faculty/schedule/today');
export const getWeeklySchedule = (params) => api.get('/api/faculty/schedule/weekly', { params });
export const getUpcomingClasses = () => api.get('/api/faculty/schedule/upcoming');
export const getScheduleSummary = () => api.get('/api/faculty/schedule/summary');
export const exportSchedule = (params) => api.get('/api/faculty/schedule/export', { params, responseType: 'blob' });

// ── Notifications ─────────────────────────────────────────────────────────────
export const getFacultyNotifications = () => api.get('/api/faculty/notifications');

const ATTENDANCE_SESSION_STORAGE_KEY = 'upasthit.attendance.activeSessionId';

export const getAttendanceErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) return fallback;
  if (!error.response) return 'Backend unavailable. Please check your connection and try again.';
  return error.response.data?.message || fallback;
};

export const getStoredAttendanceSessionId = () => {
  try {
    return window.localStorage.getItem(ATTENDANCE_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const storeAttendanceSessionId = (sessionId) => {
  try {
    if (sessionId) window.localStorage.setItem(ATTENDANCE_SESSION_STORAGE_KEY, String(sessionId));
    else window.localStorage.removeItem(ATTENDANCE_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage failures (private browsing, disabled storage).
  }
};

// ── Attendance ────────────────────────────────────────────────────────────────
export const getAttendanceSummary = () => api.get('/api/faculty/attendance/summary');
export const getFacultyAttendanceAssignments = () => api.get('/api/attendance/faculty/assignments');
export const getEligibleAttendanceStudents = (params) =>
  api.get('/api/attendance/eligible-students', { params });
export const getAttendanceStudents = (params) =>
  api.get('/api/attendance/students', { params });
export const createAttendanceSession = (payload) => api.post('/api/attendance/sessions', payload);
export const startAttendanceSessionById = (sessionId) =>
  api.post(`/api/attendance/sessions/${sessionId}/start`);
export const getActiveAttendanceSession = () => api.get('/api/attendance/sessions/active');
export const getAttendanceHistory = (params) => api.get('/api/attendance/history', { params });
export const getAttendanceSession = (sessionId) => api.get(`/api/attendance/sessions/${sessionId}`);
export const getAttendanceSessionStudents = (sessionId) =>
  api.get(`/api/attendance/sessions/${sessionId}/students`);
export const getAttendanceSessionSummary = (sessionId) =>
  api.get(`/api/attendance/sessions/${sessionId}/summary`);
export const submitAttendance = (sessionId, payload) =>
  api.post(`/api/attendance/sessions/${sessionId}/records`, payload);
export const completeAttendanceSession = (sessionId) =>
  api.post(`/api/attendance/sessions/${sessionId}/complete`);
export const getSessionStatus = (sessionId) => api.get(`/api/attendance/sessions/${sessionId}`);
export const getAttendanceDetail = (id) => api.get(`/api/attendance/sessions/${id}`);
export const startAttendanceSession = async (payload) => {
  const created = await createAttendanceSession(payload);
  const sessionId = created.data?.session?.id;
  if (!sessionId) return created;
  return startAttendanceSessionById(sessionId);
};

// ── Event attendance approval ─────────────────────────────────────────────────
export const getEventAttendancePending = () => api.get('/api/faculty/attendance/event-approval?status=PENDING');
export const getEventAttendanceApproved = () => api.get('/api/faculty/attendance/event-approval?status=APPROVED');
export const getEventAttendanceRejected = () => api.get('/api/faculty/attendance/event-approval?status=REJECTED');
export const approveEventAttendance = (id) => api.patch(`/api/faculty/attendance/event-approval/${id}/approve`);
export const rejectEventAttendance = (id) => api.patch(`/api/faculty/attendance/event-approval/${id}/reject`);

// ── Leave ─────────────────────────────────────────────────────────────────────
/** GET /api/faculty/leave/student-requests */
export const getStudentLeaveRequests = (params) =>
  api.get('/api/faculty/leave/student-requests', { params });
export const getLeaveRequestDetail = (id) => api.get(`/api/faculty/leave/student-requests/${id}`);
export const approveLeaveRequest = (id) => api.patch(`/api/faculty/leave/student-requests/${id}/approve`);
export const rejectLeaveRequest = (id) => api.patch(`/api/faculty/leave/student-requests/${id}/reject`);
export const sendBackLeaveRequest = (id, reason) =>
  api.patch(`/api/faculty/leave/student-requests/${id}/send-back`, { reason });

/** GET /api/faculty/leave/my — personal leave */
export const getMyLeaveRequests = () => api.get('/api/faculty/leave/my');
export const getMyLeaveBalance = () => api.get('/api/faculty/leave/my/balance');
/** POST /api/faculty/leave/my/apply */
export const applyForLeave = (payload) => api.post('/api/faculty/leave/my/apply', payload);
export const getLeaveRequests = () => api.get('/api/faculty/leave/student-requests');

// ── Assignments ───────────────────────────────────────────────────────────────
export const getAssignmentStats = () => api.get('/api/faculty/assignments/stats');
/** GET /api/faculty/assignments?department&batch&subject&type&status&from&to&tab */
export const getAssignments = (params) => api.get('/api/faculty/assignments', { params });
export const getAssignmentDetail = (id) => api.get(`/api/faculty/assignments/${id}`);
/** POST /api/faculty/assignments */
export const createAssignment = (payload) => api.post('/api/faculty/assignments', payload);
export const updateAssignment = (id, payload) => api.patch(`/api/faculty/assignments/${id}`, payload);
export const deleteAssignment = (id) => api.delete(`/api/faculty/assignments/${id}`);
export const getAssignmentSubmissions = (id) => api.get(`/api/faculty/assignments/${id}/submissions`);
export const getRecentSubmissions = () => api.get('/api/faculty/assignments/recent-submissions');

// ── Events ────────────────────────────────────────────────────────────────────
export const getEventStats = () => api.get('/api/faculty/events/stats');
/** GET /api/faculty/events?committee&status&from&to&tab&search */
export const getEvents = (params) => api.get('/api/faculty/events', { params });
export const getEventDetail = (id) => api.get(`/api/faculty/events/${id}`);
/** POST /api/faculty/events */
export const createEvent = (payload) => api.post('/api/faculty/events', payload);
export const updateEvent = (id, payload) => api.patch(`/api/faculty/events/${id}`, payload);
export const getUpcomingEvents = () => api.get('/api/faculty/events/upcoming');
export const getEventCategories = () => api.get('/api/faculty/events/categories');

// ── Campus / Announcements ────────────────────────────────────────────────────
export const getAnnouncementStats = () => api.get('/api/faculty/campus/stats');
/** GET /api/faculty/campus/announcements?category&status&from&to&search&tab */
export const getAnnouncements = (params) => api.get('/api/faculty/campus/announcements', { params });
export const getAnnouncementDetail = (id) => api.get(`/api/faculty/campus/announcements/${id}`);
/** POST /api/faculty/campus/announcements */
export const createAnnouncement = (payload) => api.post('/api/faculty/campus/announcements', payload);
export const updateAnnouncement = (id, payload) => api.patch(`/api/faculty/campus/announcements/${id}`, payload);
export const getPinnedAnnouncements = () => api.get('/api/faculty/campus/announcements?status=PINNED&limit=5');
