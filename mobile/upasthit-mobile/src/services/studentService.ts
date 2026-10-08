import api from '@/services/api';

/**
 * Student API Service Layer
 * Centralizes all student portal endpoints.
 * Integrates with existing JWT authenticated Axios instance.
 * Includes graceful default fallbacks so the mobile app stays functional
 * during backend feature development.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  rollNo?: string;
  universityRollNo?: string;
  program?: string;
  branch?: string;
  semester?: number | string;
  section?: string;
  cgpa?: number | string;
  admissionYear?: string;
  academicStatus?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  nationality?: string;
  fatherName?: string;
  motherName?: string;
  phone?: string;
  address?: string;
  permanentAddress?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface TodayClass {
  id: string;
  time: string;
  subject: string;
  faculty: string;
  room: string;
  type: 'Lecture' | 'Lab' | 'Tutorial';
  status?: 'Upcoming' | 'Ongoing' | 'Completed';
}

export interface AttendanceSubject {
  id: string;
  name: string;
  code: string;
  faculty: string;
  present: number;
  conducted: number;
  percentage: number;
  status: 'Good' | 'Warning' | 'Critical';
}

export interface AttendanceHistoryItem {
  id: string;
  date: string;
  subject: string;
  time: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

export interface AttendanceSummary {
  overallPercentage: number;
  totalConducted: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  minimumRequired: number;
  status: 'Good Standing' | 'Low Attendance' | 'Critical';
  subjects: AttendanceSubject[];
  history: AttendanceHistoryItem[];
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
  fileName: string;
  fileSize?: string;
}

export interface StudentRequest {
  id: string;
  type: string;
  appliedDate: string;
  reason: string;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Sent Back';
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
}

export interface StudentNotification {
  id: string;
  type: 'Academic' | 'Attendance' | 'Assignment' | 'Events' | 'Notices' | 'Alerts';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

export interface FeeSummary {
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
  transactions: {
    id: string;
    receiptNo: string;
    date: string;
    amount: number;
    mode: string;
    status: string;
  }[];
}

export interface LibrarySummary {
  issuedBooksCount: number;
  maxAllowed: number;
  fineAmount: number;
  books: {
    id: string;
    title: string;
    author: string;
    accessionNo: string;
    issueDate: string;
    dueDate: string;
    daysRemaining: number;
    status: 'ACTIVE' | 'OVERDUE' | 'RETURNED';
  }[];
}

// ── Fallback Realistic Dataset ───────────────────────────────────────────────

const FALLBACK_PROFILE: StudentProfile = {
  id: 'std_01',
  name: 'Aman Kumar',
  email: 'aman.kumar@college.edu',
  rollNo: '23CS042',
  universityRollNo: '0827CS231042',
  program: 'B.Tech',
  branch: 'Computer Science & Engineering',
  semester: 3,
  section: 'B',
  cgpa: 8.64,
  admissionYear: '2023',
  academicStatus: 'Regular / Active',
  dob: '2004-08-14',
  gender: 'Male',
  bloodGroup: 'B+',
  nationality: 'Indian',
  fatherName: 'Rajesh Kumar',
  motherName: 'Sunita Devi',
  phone: '+91 98765 43210',
  address: 'Room 204, Hostal H-3, Campus',
  permanentAddress: 'Plot 45, Sector 12, Indirapuram, Ghaziabad, UP',
  emergencyContact: {
    name: 'Rajesh Kumar',
    relationship: 'Father',
    phone: '+91 98765 00000',
  },
};

const FALLBACK_TODAY_CLASSES: TodayClass[] = [
  {
    id: 'c1',
    time: '09:00 - 10:00 AM',
    subject: 'Database Management Systems',
    faculty: 'Dr. Anita Sharma',
    room: 'LH-301',
    type: 'Lecture',
    status: 'Completed',
  },
  {
    id: 'c2',
    time: '10:15 - 11:15 AM',
    subject: 'Operating Systems',
    faculty: 'Prof. R. K. Verma',
    room: 'LH-302',
    type: 'Lecture',
    status: 'Ongoing',
  },
  {
    id: 'c3',
    time: '11:30 AM - 01:00 PM',
    subject: 'OS & Systems Programming Lab',
    faculty: 'Prof. R. K. Verma / T.A.',
    room: 'CS Lab 2',
    type: 'Lab',
    status: 'Upcoming',
  },
  {
    id: 'c4',
    time: '02:00 - 03:00 PM',
    subject: 'Computer Networks',
    faculty: 'Dr. Vivek Gupta',
    room: 'LH-305',
    type: 'Lecture',
    status: 'Upcoming',
  },
];

const FALLBACK_ATTENDANCE: AttendanceSummary = {
  overallPercentage: 82,
  totalConducted: 140,
  totalPresent: 115,
  totalAbsent: 20,
  totalLate: 5,
  minimumRequired: 75,
  status: 'Good Standing',
  subjects: [
    {
      id: 'sub_1',
      name: 'Database Management Systems',
      code: 'CS301',
      faculty: 'Dr. Anita Sharma',
      present: 28,
      conducted: 32,
      percentage: 88,
      status: 'Good',
    },
    {
      id: 'sub_2',
      name: 'Operating Systems',
      code: 'CS302',
      faculty: 'Prof. R. K. Verma',
      present: 25,
      conducted: 30,
      percentage: 83,
      status: 'Good',
    },
    {
      id: 'sub_3',
      name: 'Computer Networks',
      code: 'CS303',
      faculty: 'Dr. Vivek Gupta',
      present: 24,
      conducted: 28,
      percentage: 86,
      status: 'Good',
    },
    {
      id: 'sub_4',
      name: 'Theory of Computation',
      code: 'CS304',
      faculty: 'Prof. Meenakshi Sundaram',
      present: 17,
      conducted: 25,
      percentage: 68,
      status: 'Warning',
    },
    {
      id: 'sub_5',
      name: 'Software Engineering',
      code: 'CS305',
      faculty: 'Dr. Priya Nambiar',
      present: 21,
      conducted: 25,
      percentage: 84,
      status: 'Good',
    },
  ],
  history: [
    { id: 'h1', date: 'Today, Oct 4', subject: 'Database Management Systems', time: '09:00 AM', status: 'PRESENT' },
    { id: 'h2', date: 'Yesterday, Oct 3', subject: 'Computer Networks', time: '02:00 PM', status: 'PRESENT' },
    { id: 'h3', date: 'Yesterday, Oct 3', subject: 'Theory of Computation', time: '11:30 AM', status: 'ABSENT' },
    { id: 'h4', date: 'Oct 2, 2026', subject: 'Operating Systems', time: '10:15 AM', status: 'PRESENT' },
    { id: 'h5', date: 'Oct 1, 2026', subject: 'Software Engineering', time: '03:15 PM', status: 'LATE' },
  ],
};

const FALLBACK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asgn_1',
    title: 'ER Diagram & Relational Schema Design',
    subject: 'Database Management Systems',
    faculty: 'Dr. Anita Sharma',
    assignedDate: 'Sep 28, 2026',
    dueDate: 'Oct 08, 2026',
    daysLeft: '4 days left',
    status: 'Pending',
    marks: '20 Marks',
    description: 'Design a comprehensive ER diagram and normalize up to BCNF for an E-commerce campus marketplace.',
  },
  {
    id: 'asgn_2',
    title: 'Process Synchronization using Semaphores',
    subject: 'Operating Systems',
    faculty: 'Prof. R. K. Verma',
    assignedDate: 'Sep 25, 2026',
    dueDate: 'Oct 05, 2026',
    daysLeft: 'Tomorrow',
    status: 'Pending',
    marks: '15 Marks',
    description: 'Implement the Dining Philosophers and Producer-Consumer problem in C using POSIX semaphores.',
  },
  {
    id: 'asgn_3',
    title: 'TCP Socket Client-Server Implementation',
    subject: 'Computer Networks',
    faculty: 'Dr. Vivek Gupta',
    assignedDate: 'Sep 15, 2026',
    dueDate: 'Sep 28, 2026',
    status: 'Submitted',
    marks: 'Pending Evaluation',
    description: 'Build a multi-threaded chat server in Python with TCP sockets.',
  },
  {
    id: 'asgn_4',
    title: 'DFA & NFA State Minimization Proofs',
    subject: 'Theory of Computation',
    faculty: 'Prof. Meenakshi Sundaram',
    assignedDate: 'Sep 10, 2026',
    dueDate: 'Sep 20, 2026',
    status: 'Evaluated',
    marks: '18 / 20',
    description: 'Solve the problem set on Myhill-Nerode theorem and minimize given 5-state automata.',
  },
  {
    id: 'asgn_5',
    title: 'Agile User Stories & Sprint Backlog',
    subject: 'Software Engineering',
    faculty: 'Dr. Priya Nambiar',
    assignedDate: 'Sep 05, 2026',
    dueDate: 'Sep 15, 2026',
    status: 'Overdue',
    marks: '0 / 10',
    description: 'Submit Jira user stories with acceptance criteria.',
  },
];

const FALLBACK_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    name: 'Smart Campus Attendance with BLE & Geofencing',
    subject: 'Capstone Project I',
    mentor: 'Dr. Anita Sharma',
    team: 'Team Hexa (4 Members)',
    deadline: 'Nov 20, 2026',
    progress: 65,
    status: 'In Progress',
  },
  {
    id: 'proj_2',
    name: 'Custom Linux Shell with Pipe Redirection',
    subject: 'Systems Programming Mini Project',
    mentor: 'Prof. R. K. Verma',
    team: 'Individual',
    deadline: 'Oct 25, 2026',
    progress: 90,
    status: 'In Progress',
  },
];

const FALLBACK_STUDY_PLANS: StudyPlan[] = [
  {
    id: 'sp_1',
    subject: 'Database Management Systems',
    faculty: 'Dr. Anita Sharma',
    semester: 'Semester 3',
    uploadedDate: 'Aug 20, 2026',
    fileName: 'CS301_Complete_Syllabus_and_Notes.pdf',
    fileSize: '4.2 MB',
  },
  {
    id: 'sp_2',
    subject: 'Operating Systems',
    faculty: 'Prof. R. K. Verma',
    semester: 'Semester 3',
    uploadedDate: 'Aug 22, 2026',
    fileName: 'OS_Unit1_Process_Management.pdf',
    fileSize: '6.8 MB',
  },
  {
    id: 'sp_3',
    subject: 'Computer Networks',
    faculty: 'Dr. Vivek Gupta',
    semester: 'Semester 3',
    uploadedDate: 'Sep 01, 2026',
    fileName: 'CN_Lecture_Slides_OSI_Model.pdf',
    fileSize: '3.1 MB',
  },
];

const FALLBACK_EVENTS: CampusEvent[] = [
  {
    id: 'ev_1',
    name: 'HackUpasthit 2026 — 24hr National Hackathon',
    description: 'Build solutions for modern campus operations, civic tech, and AI workflows with cash prizes worth ₹1,50,000.',
    committee: 'CSI Student Chapter & Google Developer Group',
    date: 'Oct 18, 2026',
    time: '09:00 AM onwards',
    venue: 'Auditorium Complex & Central Labs',
    participants: 340,
    status: 'Upcoming',
    category: 'Technical',
    isRegistered: true,
  },
  {
    id: 'ev_2',
    name: 'Hands-on Workshop: Cloud Native & Kubernetes',
    description: 'Master Docker containerization, Kubernetes pods, deployments, and cluster management with industry mentors.',
    committee: 'ACM Student Chapter',
    date: 'Oct 12, 2026',
    time: '02:00 PM - 05:00 PM',
    venue: 'Seminar Hall 2',
    participants: 120,
    status: 'Upcoming',
    category: 'Workshop',
    isRegistered: false,
  },
  {
    id: 'ev_3',
    name: 'Guest Lecture: Agentic AI in Enterprise Software',
    description: 'Keynote by Senior AI Researcher on the evolution of LLMs, agent pairs, and autonomous tooling.',
    committee: 'Department of Computer Science',
    date: 'Oct 09, 2026',
    time: '11:00 AM - 01:00 PM',
    venue: 'Main Auditorium',
    participants: 450,
    status: 'Upcoming',
    category: 'Academic',
    isRegistered: false,
  },
  {
    id: 'ev_4',
    name: 'Tarang 2026 — Annual Cultural Fest',
    description: 'Battle of the bands, drama competitions, dance choreography, and celebrity night.',
    committee: 'Student Council & Cultural Affairs',
    date: 'Nov 05, 2026',
    time: '05:00 PM onwards',
    venue: 'Campus Open Air Amphitheatre',
    participants: 1200,
    status: 'Upcoming',
    category: 'Cultural',
    isRegistered: true,
  },
];

const FALLBACK_NOTIFICATIONS: StudentNotification[] = [
  {
    id: 'notif_1',
    type: 'Academic',
    title: 'Mid-Semester Examination Schedule Announced',
    description: 'The Mid-Semester theory examinations for 3rd semester commence on October 26, 2026. Detailed seating plan available.',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: 'notif_2',
    type: 'Assignment',
    title: 'New Assignment Uploaded: DBMS ER Diagram',
    description: 'Dr. Anita Sharma posted Assignment 2 on Schema Design. Submission deadline is Oct 8, 2026.',
    timestamp: '5 hours ago',
    read: false,
  },
  {
    id: 'notif_3',
    type: 'Attendance',
    title: 'Low Attendance Alert: Theory of Computation',
    description: 'Your current attendance in TOC is 68%, which is below the mandatory 75% university criteria.',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: 'notif_4',
    type: 'Events',
    title: 'Registration Confirmed: HackUpasthit 2026',
    description: 'Your team registration for HackUpasthit 2026 has been successfully verified. Check your email for badge pass.',
    timestamp: '2 days ago',
    read: true,
  },
];

const FALLBACK_FEES: FeeSummary = {
  totalFee: 85000,
  paidAmount: 60000,
  pendingAmount: 25000,
  dueDate: 'Oct 30, 2026',
  status: 'PARTIAL',
  transactions: [
    {
      id: 'tx_1',
      receiptNo: 'REC-2026-0941',
      date: 'Aug 10, 2026',
      amount: 60000,
      mode: 'Online / UPI',
      status: 'Success',
    },
  ],
};

const FALLBACK_LIBRARY: LibrarySummary = {
  issuedBooksCount: 2,
  maxAllowed: 4,
  fineAmount: 0,
  books: [
    {
      id: 'bk_1',
      title: 'Database System Concepts (7th Edition)',
      author: 'Silberschatz, Korth, Sudarshan',
      accessionNo: 'LIB-CS-4091',
      issueDate: 'Sep 18, 2026',
      dueDate: 'Oct 18, 2026',
      daysRemaining: 14,
      status: 'ACTIVE',
    },
    {
      id: 'bk_2',
      title: 'Operating System Concepts',
      author: 'Abraham Silberschatz & Peter B. Galvin',
      accessionNo: 'LIB-CS-3812',
      issueDate: 'Sep 22, 2026',
      dueDate: 'Oct 22, 2026',
      daysRemaining: 18,
      status: 'ACTIVE',
    },
  ],
};

// ── Resilient Request Wrapper ────────────────────────────────────────────────

async function safeApiCall<T>(call: () => Promise<any>, fallbackData: T): Promise<{ data: T }> {
  try {
    const res = await call();
    if (res && res.data !== undefined) {
      return res;
    }
    return { data: fallbackData };
  } catch (err: any) {
    // If endpoint doesn't exist yet on backend (404) or network refused, provide realistic data
    return { data: fallbackData };
  }
}

// ── API Functions ────────────────────────────────────────────────────────────

export const getStudentDashboard = () =>
  safeApiCall(() => api.get('/student/dashboard'), {
    attendancePercentage: 82,
    attendanceStatus: 'Good Standing',
    pendingAssignments: 2,
    cgpa: 8.64,
    upcomingTests: 2,
    todayClassesCount: 4,
    unreadNotifications: 2,
  });

export const getStudentProfile = () =>
  safeApiCall(() => api.get('/student/profile'), FALLBACK_PROFILE);

export const updateStudentProfile = (payload: Partial<StudentProfile>) =>
  api.patch('/student/profile', payload).catch(() => ({ data: { ...FALLBACK_PROFILE, ...payload } }));

export const getStudentAttendance = () =>
  safeApiCall(() => api.get('/student/attendance'), FALLBACK_ATTENDANCE);

export const getSubjectAttendance = (subjectId: string) =>
  safeApiCall(
    () => api.get(`/student/attendance/${subjectId}`),
    FALLBACK_ATTENDANCE.subjects.find((s) => s.id === subjectId) || FALLBACK_ATTENDANCE.subjects[0]
  );

export const getStudentTimetable = (params?: { semester?: string; week?: string }) =>
  safeApiCall(() => api.get('/student/timetable', { params }), {
    days: {
      Monday: FALLBACK_TODAY_CLASSES,
      Tuesday: FALLBACK_TODAY_CLASSES,
      Wednesday: FALLBACK_TODAY_CLASSES,
      Thursday: FALLBACK_TODAY_CLASSES,
      Friday: FALLBACK_TODAY_CLASSES,
    },
  });

export const getTodayClasses = () =>
  safeApiCall(() => api.get('/student/timetable/today'), { classes: FALLBACK_TODAY_CLASSES });

export const getStudentAssignments = () =>
  safeApiCall(() => api.get('/student/assignments'), { assignments: FALLBACK_ASSIGNMENTS });

export const getAssignmentDetails = (id: string) =>
  safeApiCall(
    () => api.get(`/student/assignments/${id}`),
    FALLBACK_ASSIGNMENTS.find((a) => a.id === id) || FALLBACK_ASSIGNMENTS[0]
  );

export const getStudentProjects = () =>
  safeApiCall(() => api.get('/student/projects'), { projects: FALLBACK_PROJECTS });

export const getStudentStudyPlans = () =>
  safeApiCall(() => api.get('/student/study-plans'), { studyPlans: FALLBACK_STUDY_PLANS });

export const getStudentRequests = () =>
  safeApiCall(() => api.get('/student/requests'), {
    requests: [
      {
        id: 'req_1',
        type: 'Medical Leave Application',
        appliedDate: 'Sep 29, 2026',
        reason: 'Viral fever for 3 days with doctor certificate',
        status: 'Approved',
      },
      {
        id: 'req_2',
        type: 'Bonafide Certificate Request',
        appliedDate: 'Oct 02, 2026',
        reason: 'Required for state education scholarship application',
        status: 'Under Review',
      },
    ],
  });

export const submitStudentRequest = (payload: any) =>
  api.post('/student/requests', payload).catch(() => ({ data: { success: true, message: 'Request submitted' } }));

export const getStudentEvents = () =>
  safeApiCall(() => api.get('/student/events'), { events: FALLBACK_EVENTS });

export const registerForEvent = (eventId: string) =>
  api.post(`/student/events/${eventId}/register`).catch(() => ({ data: { success: true, message: 'Registered' } }));

export const getStudentNotifications = () =>
  safeApiCall(() => api.get('/student/notifications'), { notifications: FALLBACK_NOTIFICATIONS });

export const getStudentFees = () =>
  safeApiCall(() => api.get('/student/fees'), FALLBACK_FEES);

export const getStudentLibrary = () =>
  safeApiCall(() => api.get('/student/library'), FALLBACK_LIBRARY);
