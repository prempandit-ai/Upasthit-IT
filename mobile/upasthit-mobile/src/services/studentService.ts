import api from '@/services/api';

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  rollNo?: string;
  studentId?: string;
  enrollmentNo?: string;
  universityRollNo?: string;
  program?: string;
  branch?: string;
  departmentCode?: string;
  departmentName?: string;
  academicYear?: string;
  semester?: number | string;
  section?: string;
  division?: string;
  year?: string;
  cgpa?: number | string;
  admissionYear?: string;
  academicStatus?: string;
  enrollmentStatus?: string;
  approvalStatus?: string;
  dob?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  nationality?: string;
  fatherName?: string;
  motherName?: string;
  phone?: string;
  mobileNumber?: string;
  address?: string;
  permanentAddress?: string;
  emergencyContact?: { name: string; relationship: string; phone: string };
  subjectEnrollments?: any[];
}

export interface TodayClass {
  id: string;
  time: string;
  subject: string;
  faculty: string;
  room: string | null;
  type: 'Lecture' | 'Lab' | 'Tutorial';
  status?: 'Upcoming' | 'Ongoing' | 'Completed';
}

export interface AttendanceSubject {
  id: string;
  name: string;
  code: string;
  faculty: string | null;
  present: number;
  absent: number;
  conducted: number;
  applicableSessions: number;
  percentage: number | null;
  status: null;
}

export interface AttendanceHistoryItem {
  id: string;
  date: string;
  subject: string;
  subjectCode: string;
  faculty: string | null;
  time: string | null;
  status: 'PRESENT' | 'ABSENT';
  sessionType: string;
  division: string;
  labBatch: string | null;
  academicYear: string;
  semester: number;
  year: string;
  markedAt: string;
}

export interface AttendanceSummary {
  overallPercentage: number | null;
  totalConducted: number;
  totalApplicableSessions: number;
  totalApplicableLectures: number;
  totalApplicableLabSessions: number;
  totalMarked: number;
  totalPresent: number;
  totalAbsent: number;
  unmarkedCount: number;
  totalLate: number;
  minimumRequired: null;
  status: null;
  attendanceBasis: string;
  subjects: AttendanceSubject[];
  history: AttendanceHistoryItem[];
}

export interface ActiveAttendanceSession {
  id: number;
  status: 'ACTIVE';
  sessionDate: string;
  attendanceType: string | null;
  sessionType: string | null;
  division: string;
  labBatch: string | null;
  academicYear: string;
  year: string;
  semester: number;
  startedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  serverTime: string;
  serverClockOffsetMs?: number;
  subject: { id: number; code: string; name: string };
  faculty: string;
  attendanceStatus: 'PRESENT' | 'ABSENT' | null;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  faculty: string;
  assignedDate: string;
  dueDate: string;
  daysLeft?: string;
  status: 'Pending' | 'Submitted' | 'Evaluated' | 'Overdue';
  marks?: string;
  description?: string;
  instructions?: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  feedback?: string | null;
  submission?: { id: string; responseText?: string | null; attachmentUrl?: string | null; attachmentName?: string | null; submittedAt: string; feedbackReleased: boolean } | null;
}

export interface Project {
  id: string;
  name: string;
  subject: string;
  mentor: string;
  team: string;
  deadline: string;
  progress: number;
  status: 'Not Started' | 'In Progress' | 'Submitted' | 'Completed';
}

export interface StudyPlan {
  id: string;
  subject: string;
  faculty: string;
  semester: string;
  uploadedDate: string;
  fileName?: string | null;
  fileUrl?: string | null;
  fileSize?: string;
}

export interface StudentRequest {
  id: string;
  type: string;
  appliedDate: string;
  reason: string;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Sent Back';
  startDate?: string;
  endDate?: string;
  reviewerRemarks?: { action: string; remarks: string | null; reviewer: string; createdAt: string }[];
}

export interface CampusEvent {
  id: string;
  name: string;
  description: string;
  committee: string;
  date: string;
  time: string;
  venue: string;
  participants: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  category?: 'Technical' | 'Cultural' | 'Sports' | 'Workshop' | 'Academic';
  isRegistered?: boolean;
  canRegister?: boolean;
  canCancel?: boolean;
  allowCancellation?: boolean;
  registrationDeadline?: string | null;
}

export interface StudentNotification {
  id: string;
  type: 'Academic' | 'Attendance' | 'Assignment' | 'Events' | 'Notices' | 'Alerts';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  relatedUrl?: string | null;
}

export interface FeeSummary {
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'UNAVAILABLE';
  charges?: { id: number; title: string; academicYear: string; amount: number; dueDate: string | null }[];
  paymentProcessingAvailable?: boolean;
  transactions: { id: string; receiptNo: string; date: string; amount: number; mode: string; status: string }[];
}

export interface LibrarySummary {
  issuedBooksCount: number;
  maxAllowed: number;
  fineAmount: number;
  finePolicyConfigured?: boolean;
  books: { id: number; title: string; author: string | null; accessionCode?: string | null; availableCopies: number; totalCopies: number }[];
  loans?: { id: string; bookId: number; title: string; author: string | null; accessionNo: string | null; issueDate: string; dueDate: string; returnedAt: string | null; status: 'ACTIVE' | 'OVERDUE' | 'RETURNED'; fineAmount: number | null }[];
}

export interface StudentDocumentRecord {
  id: string;
  title: string;
  type: string;
  fileName: string;
  fileUrl: string;
  status: 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  submittedAt: string;
  reviewerRemarks?: string | null;
}

function mapStudentProfile(profile: any): StudentProfile {
  const user = profile.user || {};
  const departmentCode = profile.department?.code || profile.departmentCode || undefined;
  const departmentName = profile.department?.name || profile.departmentName || undefined;
  return {
    id: String(profile.id ?? user.id ?? ''),
    name: user.name || profile.name || '',
    email: user.email || profile.email || '',
    role: user.role || profile.role,
    rollNo: profile.rollNo == null ? undefined : String(profile.rollNo),
    studentId: profile.studentId || undefined,
    enrollmentNo: profile.enrollmentNo || undefined,
    universityRollNo: profile.enrollmentNo || profile.studentId || undefined,
    departmentCode,
    departmentName,
    branch: departmentName || departmentCode,
    semester: profile.semester ?? undefined,
    division: profile.division || undefined,
    year: profile.year || undefined,
    academicYear: profile.academicYear || undefined,
    admissionYear: profile.academicYear || undefined,
    academicStatus: profile.enrollmentStatus || undefined,
    enrollmentStatus: profile.enrollmentStatus || undefined,
    approvalStatus: user.status || profile.approvalStatus || undefined,
    program: profile.program || undefined,
    dob: profile.dob || profile.dateOfBirth || undefined,
    gender: profile.gender || undefined,
    bloodGroup: profile.bloodGroup || undefined,
    nationality: profile.nationality || undefined,
    fatherName: profile.fatherName || undefined,
    motherName: profile.motherName || undefined,
    phone: profile.mobileNumber || profile.phone || undefined,
    mobileNumber: profile.mobileNumber || profile.phone || undefined,
    address: profile.address || undefined,
    emergencyContact: profile.emergencyContact || undefined,
  };
}

export const getStudentDashboard = async () => {
  const res = await api.get('/student/dashboard');
  if (!res.data?.data) throw new Error('Student dashboard data is unavailable.');
  return { data: res.data.data };
};

export const getStudentProfile = async (): Promise<{ data: StudentProfile }> => {
  const res = await api.get('/student/profile');
  if (!res.data?.profile) throw new Error('Student profile not found.');
  return { data: mapStudentProfile(res.data.profile) };
};

export const updateStudentProfile = (payload: Partial<StudentProfile>) => api.patch('/student/profile', payload);

export const getStudentSubjects = async () => {
  const res = await api.get('/student/subjects');
  return { data: { enrollments: res.data?.enrollments ?? [] } };
};

export const getStudentAttendance = async (): Promise<{ data: AttendanceSummary }> => {
  const res = await api.get('/student/attendance');
  if (!res.data?.data) throw new Error('Attendance data is unavailable.');
  return { data: res.data.data };
};

export const getSubjectAttendance = async (subjectId: string) => {
  const { data } = await getStudentAttendance();
  return { data: data.subjects.find((subject) => subject.id === subjectId) ?? null };
};

export const getStudentTimetable = async (params?: { semester?: string; week?: string }) => {
  const res = await api.get('/student/timetable', { params });
  return { data: res.data?.data ?? res.data };
};

export const getTodayClasses = async (): Promise<{ data: { classes: TodayClass[] } }> => {
  const res = await api.get('/student/timetable/today');
  const entries = res.data?.entries ?? [];
  return { data: { classes: entries.map((entry: any) => ({
    id: String(entry.id), time: entry.time || `${entry.startTime} - ${entry.endTime}`,
    subject: entry.subject?.subjectName || entry.subject || '',
    faculty: entry.faculty?.user?.name || entry.faculty || '', room: entry.room || null,
    type: entry.sessionType === 'LAB' || entry.type === 'Lab' ? 'Lab' : entry.sessionType === 'TUTORIAL' || entry.type === 'Tutorial' ? 'Tutorial' : 'Lecture',
  })) } };
};

export const getStudentAssignments = async () => {
  const res = await api.get('/student/assignments');
  return { data: res.data?.data ?? res.data };
};
export const getAssignmentDetails = async (id: string) => api.get(`/student/assignments/${id}`);
export const submitStudentAssignment = (id: string, payload: { responseText?: string; attachmentUrl?: string; attachmentName?: string }) =>
  api.post(`/student/assignments/${id}/submissions`, payload);
export const getStudentProjects = async () => {
  const res = await api.get('/student/projects');
  return { data: res.data?.data ?? res.data };
};
export const getStudentStudyPlans = async () => {
  const res = await api.get('/student/study-plans');
  return { data: res.data?.data ?? res.data };
};
export const getStudentRequests = async () => {
  const res = await api.get('/student/requests');
  const mapStatus: Record<string, string> = { PENDING: 'Pending', UNDER_REVIEW: 'Under Review', APPROVED: 'Approved', REJECTED: 'Rejected', SENT_BACK: 'Sent Back' };
  const data = res.data?.data ?? res.data;
  return { data: { ...data, requests: (data?.requests ?? []).map((request: any) => ({ ...request, status: mapStatus[request.status] || request.status })) } };
};
export const submitStudentRequest = async (payload: any) => {
  const res = await api.post('/student/requests', payload);
  const request = res.data?.request;
  const mapStatus: Record<string, string> = { PENDING: 'Pending', UNDER_REVIEW: 'Under Review', APPROVED: 'Approved', REJECTED: 'Rejected', SENT_BACK: 'Sent Back' };
  return { ...res, data: { ...res.data, request: request ? { ...request, status: mapStatus[request.status] || request.status } : null } };
};
export const getStudentEvents = async () => {
  const res = await api.get('/student/events');
  return { data: res.data?.data ?? res.data };
};
export const registerForEvent = (eventId: string) => api.post(`/student/events/${eventId}/register`);
export const cancelEventRegistration = (eventId: string) => api.delete(`/student/events/${eventId}/register`);
export const getStudentNotifications = async () => {
  const res = await api.get('/student/notifications');
  return { data: res.data?.data ?? res.data };
};
export const markStudentNotificationRead = (id: string) => api.patch(`/student/notifications/${encodeURIComponent(id)}/read`);
export const getStudentFees = async (): Promise<{ data: FeeSummary | null }> => {
  const res = await api.get('/student/fees');
  return { data: res.data?.data ?? res.data?.fees ?? null };
};
export const getStudentDocuments = async () => {
  const res = await api.get('/student/documents');
  return { data: { documents: res.data?.data?.documents ?? [] } };
};
export const getStudentLibrary = async (): Promise<{ data: LibrarySummary | null }> => {
  const res = await api.get('/student/library');
  return { data: res.data?.data ?? res.data?.library ?? null };
};

export const getActiveStudentAttendanceSessions = async () => {
  const res = await api.get('/student/attendance/sessions/active');
  const receivedAt = Date.now();
  const sessions = (res.data?.sessions ?? []) as ActiveAttendanceSession[];
  return {
    data: {
      sessions: sessions.map((session) => ({
        ...session,
        serverClockOffsetMs: receivedAt - new Date(session.serverTime).getTime(),
      })),
    },
  };
};

export const checkInToAttendanceSession = async (sessionId: number, code: string) => {
  const res = await api.post(`/student/attendance/sessions/${sessionId}/check-in`, { code });
  if (res.data?.success !== true || res.data?.status !== 'PRESENT') {
    throw new Error(res.data?.message || 'Attendance check-in was not confirmed by the server.');
  }
  return { data: res.data as { success: true; status: 'PRESENT'; alreadyCheckedIn: boolean; checkedInAt: string | null } };
};
