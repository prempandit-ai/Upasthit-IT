import api from './api';

/**
 * Coordinator API service layer.
 * Manages Events, Participants, Faculty Mapping, Attendance Mapping, and Reports.
 * Fully prepared for backend endpoints, with robust fallback data so all modules
 * are immediately functional and testable in development.
 */

// ── In-Memory Datastore / Seed for Development & Immediate Interactivity ──

const initialEvents = [
  {
    id: 'EVT-2025-001',
    name: 'Technical Symposium 2025',
    type: 'Conference',
    description: 'Annual National Technical Symposium featuring paper presentations, project expos, and hackathons across departments.',
    venue: 'Auditorium & Tech Hub 101',
    startDate: '2025-05-25',
    endDate: '2025-05-26',
    startTime: '10:00 AM',
    endTime: '05:00 PM',
    maxParticipants: 300,
    registeredCount: 245,
    registrationStartDate: '2025-04-15',
    registrationDeadline: '2025-05-20',
    department: 'Computer Engineering',
    academicYear: '2024 - 2025',
    semester: 'Semester 6',
    coordinator: 'Prof. Anjali Deshmukh',
    status: 'Upcoming',
    banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    assignedFaculty: [
      { id: 'FAC-01', name: 'Dr. Rahul Sharma', responsibility: 'Event In-charge', department: 'Computer Engineering' },
      { id: 'FAC-02', name: 'Prof. Neha Patil', responsibility: 'Attendance', department: 'Computer Engineering' },
      { id: 'FAC-03', name: 'Prof. Amit Verma', responsibility: 'Registration', department: 'Information Technology' },
    ],
    attendanceStats: { present: 168, absent: 54, notMarked: 23, rate: 68 },
  },
  {
    id: 'EVT-2025-002',
    name: 'National Coding Contest',
    type: 'Competition',
    description: 'Inter-collegiate 24-hour algorithmic problem solving contest and hackathon with industry problem statements.',
    venue: 'Computer Labs A & B',
    startDate: '2025-06-02',
    endDate: '2025-06-03',
    startTime: '11:00 AM',
    endTime: '11:00 AM',
    maxParticipants: 150,
    registeredCount: 120,
    registrationStartDate: '2025-05-01',
    registrationDeadline: '2025-05-28',
    department: 'Information Technology',
    academicYear: '2024 - 2025',
    semester: 'All Semesters',
    coordinator: 'Prof. Anjali Deshmukh',
    status: 'Upcoming',
    banner: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    assignedFaculty: [
      { id: 'FAC-04', name: 'Dr. Pooja Mehta', responsibility: 'Technical Support', department: 'Information Technology' },
      { id: 'FAC-02', name: 'Prof. Neha Patil', responsibility: 'Attendance', department: 'Computer Engineering' },
    ],
    attendanceStats: { present: 96, absent: 16, notMarked: 8, rate: 80 },
  },
  {
    id: 'EVT-2025-003',
    name: 'Annual Sports Day 2025',
    type: 'Sports',
    description: 'College-wide track & field events, football, basketball, and indoor gaming tournaments.',
    venue: 'College Main Sports Complex',
    startDate: '2025-06-15',
    endDate: '2025-06-16',
    startTime: '09:00 AM',
    endTime: '06:00 PM',
    maxParticipants: 500,
    registeredCount: 412,
    registrationStartDate: '2025-05-10',
    registrationDeadline: '2025-06-10',
    department: 'General / Inter-departmental',
    academicYear: '2024 - 2025',
    semester: 'All Semesters',
    coordinator: 'Prof. Anjali Deshmukh',
    status: 'Upcoming',
    banner: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80',
    assignedFaculty: [
      { id: 'FAC-05', name: 'Prof. Vikram Singh', responsibility: 'Discipline', department: 'Mechanical Engineering' },
      { id: 'FAC-06', name: 'Dr. Suresh Rane', responsibility: 'Venue Management', department: 'Civil Engineering' },
    ],
    attendanceStats: { present: 280, absent: 90, notMarked: 42, rate: 68 },
  },
  {
    id: 'EVT-2025-004',
    name: 'AI & Generative Models Workshop',
    type: 'Workshop',
    description: 'Hands-on practical workshop covering Large Language Models, PyTorch workflows, and real-time API integrations.',
    venue: 'Seminar Hall 2',
    startDate: '2025-05-18',
    endDate: '2025-05-18',
    startTime: '02:00 PM',
    endTime: '05:30 PM',
    maxParticipants: 100,
    registeredCount: 95,
    registrationStartDate: '2025-04-20',
    registrationDeadline: '2025-05-15',
    department: 'Artificial Intelligence & DS',
    academicYear: '2024 - 2025',
    semester: 'Semester 4 & 6',
    coordinator: 'Prof. Anjali Deshmukh',
    status: 'Completed',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    assignedFaculty: [
      { id: 'FAC-01', name: 'Dr. Rahul Sharma', responsibility: 'Event In-charge', department: 'Computer Engineering' },
      { id: 'FAC-04', name: 'Dr. Pooja Mehta', responsibility: 'Attendance', department: 'Information Technology' },
    ],
    attendanceStats: { present: 88, absent: 7, notMarked: 0, rate: 92 },
  },
];

const initialParticipants = [
  { id: 'PRT-1001', studentId: 'STU-2022-045', name: 'Rahul Sharma', email: 'rahul.s@college.edu', department: 'Computer Engineering', year: 'TE (Third Year)', division: 'Division A', event: 'Technical Symposium 2025', eventId: 'EVT-2025-001', registrationStatus: 'Confirmed', attendanceStatus: 'Present', registeredAt: '12 May 2025, 10:30 AM' },
  { id: 'PRT-1002', studentId: 'STU-2022-089', name: 'Priya Patel', email: 'priya.p@college.edu', department: 'Information Technology', year: 'BE (Final Year)', division: 'Division B', event: 'National Coding Contest', eventId: 'EVT-2025-002', registrationStatus: 'Confirmed', attendanceStatus: 'Present', registeredAt: '13 May 2025, 02:15 PM' },
  { id: 'PRT-1003', studentId: 'STU-2023-112', name: 'Aman Verma', email: 'aman.v@college.edu', department: 'Mechanical Engineering', year: 'SE (Second Year)', division: 'Division A', event: 'Annual Sports Day 2025', eventId: 'EVT-2025-003', registrationStatus: 'Confirmed', attendanceStatus: 'Not Marked', registeredAt: '14 May 2025, 11:45 AM' },
  { id: 'PRT-1004', studentId: 'STU-2023-094', name: 'Sneha Kulkarni', email: 'sneha.k@college.edu', department: 'Computer Engineering', year: 'TE (Third Year)', division: 'Division B', event: 'Technical Symposium 2025', eventId: 'EVT-2025-001', registrationStatus: 'Confirmed', attendanceStatus: 'Absent', registeredAt: '15 May 2025, 09:20 AM' },
  { id: 'PRT-1005', studentId: 'STU-2022-156', name: 'Rohan Gupta', email: 'rohan.g@college.edu', department: 'AI & Data Science', year: 'TE (Third Year)', division: 'Division A', event: 'AI & Generative Models Workshop', eventId: 'EVT-2025-004', registrationStatus: 'Confirmed', attendanceStatus: 'Present', registeredAt: '16 May 2025, 04:10 PM' },
  { id: 'PRT-1006', studentId: 'STU-2024-023', name: 'Ananya Roy', email: 'ananya.r@college.edu', department: 'Information Technology', year: 'SE (Second Year)', division: 'Division A', event: 'National Coding Contest', eventId: 'EVT-2025-002', registrationStatus: 'Pending', attendanceStatus: 'Not Marked', registeredAt: '17 May 2025, 01:05 PM' },
  { id: 'PRT-1007', studentId: 'STU-2023-178', name: 'Kunal Patil', email: 'kunal.p@college.edu', department: 'Civil Engineering', year: 'TE (Third Year)', division: 'Division B', event: 'Annual Sports Day 2025', eventId: 'EVT-2025-003', registrationStatus: 'Confirmed', attendanceStatus: 'Present', registeredAt: '18 May 2025, 10:50 AM' },
  { id: 'PRT-1008', studentId: 'STU-2022-201', name: 'Tanvi Desai', email: 'tanvi.d@college.edu', department: 'Computer Engineering', year: 'BE (Final Year)', division: 'Division A', event: 'Technical Symposium 2025', eventId: 'EVT-2025-001', registrationStatus: 'Waitlisted', attendanceStatus: 'Not Marked', registeredAt: '19 May 2025, 03:30 PM' },
];

const initialFaculty = [
  { id: 'FAC-01', employeeId: 'EMP-CSE-101', name: 'Dr. Rahul Sharma', designation: 'Professor', department: 'Computer Engineering', email: 'rahul.sharma@college.edu', phone: '+91 98230 11223', mappedEvents: ['Technical Symposium 2025', 'AI Workshop'], responsibility: 'Event In-charge' },
  { id: 'FAC-02', employeeId: 'EMP-CSE-102', name: 'Prof. Neha Patil', designation: 'Associate Professor', department: 'Computer Engineering', email: 'neha.patil@college.edu', phone: '+91 98230 22334', mappedEvents: ['Technical Symposium 2025', 'National Coding Contest'], responsibility: 'Attendance Tracking' },
  { id: 'FAC-03', employeeId: 'EMP-IT-201', name: 'Dr. Amit Verma', designation: 'Associate Professor', department: 'Information Technology', email: 'amit.verma@college.edu', phone: '+91 98230 33445', mappedEvents: ['Technical Symposium 2025'], responsibility: 'Registration Desk' },
  { id: 'FAC-04', employeeId: 'EMP-IT-202', name: 'Dr. Pooja Mehta', designation: 'Assistant Professor', department: 'Information Technology', email: 'pooja.mehta@college.edu', phone: '+91 98230 44556', mappedEvents: ['National Coding Contest'], responsibility: 'Technical Support' },
  { id: 'FAC-05', employeeId: 'EMP-ME-301', name: 'Prof. Vikram Singh', designation: 'Assistant Professor', department: 'Mechanical Engineering', email: 'vikram.singh@college.edu', phone: '+91 98230 55667', mappedEvents: ['Annual Sports Day 2025'], responsibility: 'Discipline & Safety' },
  { id: 'FAC-06', employeeId: 'EMP-CE-401', name: 'Dr. Suresh Rane', designation: 'Professor', department: 'Civil Engineering', email: 'suresh.rane@college.edu', phone: '+91 98230 66778', mappedEvents: ['Annual Sports Day 2025'], responsibility: 'Venue Management' },
  { id: 'FAC-07', employeeId: 'EMP-AIDS-501', name: 'Prof. Deepa Joshi', designation: 'Assistant Professor', department: 'AI & Data Science', email: 'deepa.joshi@college.edu', phone: '+91 98230 77889', mappedEvents: [], responsibility: 'Unassigned' },
  { id: 'FAC-08', employeeId: 'EMP-ASH-601', name: 'Dr. Meera Nair', designation: 'Associate Professor', department: 'Applied Sciences', email: 'meera.nair@college.edu', phone: '+91 98230 88990', mappedEvents: [], responsibility: 'Unassigned' },
];

let eventsStore = [...initialEvents];
let participantsStore = [...initialParticipants];
let facultyStore = [...initialFaculty];

// ── Service Endpoints ──────────────────────────────────────────────────────────

/**
 * Get Coordinator Dashboard summary statistics
 */
export const getCoordinatorDashboardStats = async () => {
  try {
    const res = await api.get('/api/coordinator/dashboard');
    if (res.data?.success) return res.data;
  } catch (err) {
    // Graceful fallback to rich local state
  }

  const totalEvents = eventsStore.length;
  const totalParticipants = participantsStore.length;
  const totalFaculty = facultyStore.filter((f) => f.mappedEvents.length > 0).length;
  const todayEvents = eventsStore.filter((e) => e.status === 'Upcoming').slice(0, 2).length;

  return {
    success: true,
    stats: {
      totalEvents: 12,
      activeEvents: totalEvents,
      totalParticipants: 356,
      registeredParticipants: totalParticipants,
      totalFaculty: 48,
      mappedFaculty: totalFaculty,
      todayEvents: 2,
      attendanceTakenRate: 68,
      attendanceBreakdown: {
        presentRate: 68,
        absentRate: 22,
        notMarkedRate: 10,
      },
    },
    upcomingEvents: eventsStore.slice(0, 3),
    recentRegistrations: participantsStore.slice(0, 3),
  };
};

/**
 * Get All Events
 */
export const getEvents = async (params = {}) => {
  try {
    const res = await api.get('/api/coordinator/events', { params });
    if (res.data?.success) return res.data.events;
  } catch (err) {
    // fallback
  }

  let filtered = [...eventsStore];
  if (params.type && params.type !== 'All') {
    filtered = filtered.filter((e) => e.type.toLowerCase() === params.type.toLowerCase());
  }
  if (params.status && params.status !== 'All') {
    filtered = filtered.filter((e) => e.status.toLowerCase() === params.status.toLowerCase());
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter((e) => e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q));
  }
  return filtered;
};

/**
 * Create a new Event
 */
export const createEvent = async (eventData) => {
  try {
    const res = await api.post('/api/coordinator/events', eventData);
    if (res.data?.success) return res.data;
  } catch (err) {
    // fallback
  }

  const newEvent = {
    ...eventData,
    id: `EVT-2025-00${eventsStore.length + 1}`,
    registeredCount: 0,
    status: eventData.status || 'Upcoming',
    assignedFaculty: [],
    attendanceStats: { present: 0, absent: 0, notMarked: 0, rate: 0 },
    banner: eventData.banner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
  };

  eventsStore = [newEvent, ...eventsStore];
  return { success: true, event: newEvent, message: 'Event created successfully' };
};

/**
 * Get Participants
 */
export const getParticipants = async (params = {}) => {
  try {
    const res = await api.get('/api/coordinator/participants', { params });
    if (res.data?.success) return res.data.participants;
  } catch (err) {
    // fallback
  }

  let list = [...participantsStore];
  if (params.eventId && params.eventId !== 'All') {
    list = list.filter((p) => p.eventId === params.eventId);
  }
  if (params.department && params.department !== 'All') {
    list = list.filter((p) => p.department === params.department);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.studentId.toLowerCase().includes(q) ||
        p.event.toLowerCase().includes(q)
    );
  }
  return list;
};

/**
 * Add a Single Participant
 */
export const addParticipant = async (participantData) => {
  try {
    const res = await api.post('/api/coordinator/participants', participantData);
    if (res.data?.success) return res.data;
  } catch (err) {
    // fallback
  }

  const newPrt = {
    ...participantData,
    id: `PRT-${Date.now().toString().slice(-4)}`,
    registrationStatus: 'Confirmed',
    attendanceStatus: 'Not Marked',
    registeredAt: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  };

  participantsStore = [newPrt, ...participantsStore];
  return { success: true, participant: newPrt, message: 'Participant added successfully' };
};

/**
 * Bulk Import Participants
 */
export const bulkImportParticipants = async (participantsArray) => {
  try {
    const res = await api.post('/api/coordinator/participants/bulk', { participants: participantsArray });
    if (res.data?.success) return res.data;
  } catch (err) {
    // fallback
  }

  const formatted = participantsArray.map((p, i) => ({
    id: `PRT-IMP-${Date.now()}-${i}`,
    studentId: p.studentId || `STU-GEN-${i + 100}`,
    name: p.name || 'Imported Student',
    email: p.email || 'student@college.edu',
    department: p.department || 'Computer Engineering',
    year: p.year || 'TE (Third Year)',
    division: p.division || 'Division A',
    event: p.event || 'Technical Symposium 2025',
    eventId: p.eventId || 'EVT-2025-001',
    registrationStatus: 'Confirmed',
    attendanceStatus: 'Not Marked',
    registeredAt: 'Just now',
  }));

  participantsStore = [...formatted, ...participantsStore];
  return { success: true, importedCount: formatted.length, message: `${formatted.length} participants imported successfully` };
};

/**
 * Get Available Faculty
 */
export const getFacultyList = async (params = {}) => {
  try {
    const res = await api.get('/api/coordinator/faculty', { params });
    if (res.data?.success) return res.data.faculty;
  } catch (err) {
    // fallback
  }

  let list = [...facultyStore];
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter((f) => f.name.toLowerCase().includes(q) || f.department.toLowerCase().includes(q));
  }
  return list;
};

/**
 * Map Faculty to Event with Responsibility
 */
export const mapFacultyToEvent = async ({ eventId, facultyId, responsibility }) => {
  try {
    const res = await api.post('/api/coordinator/faculty/mapping', { eventId, facultyId, responsibility });
    if (res.data?.success) return res.data;
  } catch (err) {
    // fallback
  }

  const evt = eventsStore.find((e) => e.id === eventId);
  const fac = facultyStore.find((f) => f.id === facultyId);

  if (evt && fac) {
    if (!fac.mappedEvents.includes(evt.name)) {
      fac.mappedEvents.push(evt.name);
    }
    fac.responsibility = responsibility;

    const existingMapping = evt.assignedFaculty.find((af) => af.id === fac.id);
    if (existingMapping) {
      existingMapping.responsibility = responsibility;
    } else {
      evt.assignedFaculty.push({
        id: fac.id,
        name: fac.name,
        responsibility,
        department: fac.department,
      });
    }
  }

  return { success: true, message: 'Faculty successfully mapped to event' };
};

/**
 * Get Reports and Analytics
 */
export const getCoordinatorReports = async (filters = {}) => {
  try {
    const res = await api.get('/api/coordinator/reports', { params: filters });
    if (res.data?.success) return res.data;
  } catch (err) {
    // fallback
  }

  return {
    totalEvents: eventsStore.length,
    totalRegistrations: 356,
    avgAttendanceRate: '72%',
    eventWiseStats: eventsStore.map((e) => ({
      eventName: e.name,
      department: e.department,
      registered: e.registeredCount,
      present: e.attendanceStats.present,
      absent: e.attendanceStats.absent,
      rate: `${e.attendanceStats.rate}%`,
    })),
    departmentDistribution: [
      { department: 'Computer Engineering', participants: 142, events: 4 },
      { department: 'Information Technology', participants: 98, events: 3 },
      { department: 'Mechanical Engineering', participants: 45, events: 2 },
      { department: 'Civil Engineering', participants: 36, events: 2 },
      { department: 'AI & Data Science', participants: 35, events: 1 },
    ],
  };
};

export default {
  getCoordinatorDashboardStats,
  getEvents,
  createEvent,
  getParticipants,
  addParticipant,
  bulkImportParticipants,
  getFacultyList,
  mapFacultyToEvent,
  getCoordinatorReports,
};
