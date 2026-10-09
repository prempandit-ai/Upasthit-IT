const prisma = require("../config/prisma");

const IT_DEPARTMENT_CODE = "IT";
const DEFAULT_WINDOW_SECONDS = 300;
const IT_DEPARTMENT_LABEL = "Information Technology (IT)";

class AttendanceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function isItDepartment(code, name) {
  if ((code || "").toUpperCase() === IT_DEPARTMENT_CODE) return true;
  return /information\s*technology/i.test(name || "");
}

function parseSessionDate(value) {
  if (!value) {
    throw new AttendanceError("Session date is required");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new AttendanceError("Invalid session date");
  }
  return date;
}

function normalizeDivision(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (/^all(\s+(sections|divisions))?$/i.test(s)) return "ALL";
  return s.replace(/^(section|division|div)\s+/i, "").trim().toUpperCase();
}

function yearLabel(year) {
  if (year === "FY") return "First Year";
  if (year === "SY") return "Second Year";
  if (year === "TY") return "Third Year";
  if (year === "BE") return "Final Year";
  return year || "";
}

function formatBatchLabel({ year, semester, division, academicYear, departmentCode }) {
  const dept = departmentCode || IT_DEPARTMENT_CODE;
  const div = division ? ` - Div ${division}` : "";
  const yearPart = academicYear ? ` (${academicYear})` : "";
  const yearPrefix = year ? `${year} - ` : "";
  return `${yearPrefix}Semester ${semester}${div}${yearPart}`.trim();
}

function formatSectionLabel(division) {
  if (!division) return "All Sections";
  return `Section ${division}`;
}

async function getFacultyContext(userId) {
  const faculty = await prisma.facultyProfile.findUnique({
    where: { userId },
    include: {
      department: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!faculty) {
    throw new AttendanceError("Faculty profile not found", 404);
  }

  return faculty;
}

function assertItFaculty(faculty) {
  const code = faculty.department?.code;
  const name = faculty.department?.name || faculty.departmentName;
  if (!isItDepartment(code, name)) {
    throw new AttendanceError(
      "Attendance is currently available only for the Information Technology (IT) department.",
      403
    );
  }
}

function assertOwnedSession(session, facultyId) {
  if (!session) {
    throw new AttendanceError("Attendance session not found", 404);
  }
  if (session.assignment?.facultyId !== facultyId) {
    throw new AttendanceError("You are not authorized to access this attendance session", 403);
  }
}

function isExpired(session, now = new Date()) {
  return Boolean(session.expiresAt && new Date(session.expiresAt) <= now);
}

function effectiveStatus(session, now = new Date()) {
  if (session.status === "COMPLETED") return "COMPLETED";
  if (session.status === "ACTIVE" && isExpired(session, now)) return "EXPIRED";
  return session.status;
}

async function expireSessionIfNeeded(session) {
  const now = new Date();
  if (session.status === "ACTIVE" && isExpired(session, now)) {
    return prisma.attendanceSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        completedAt: session.completedAt || now,
      },
      include: sessionInclude(),
    });
  }
  return session;
}

function sessionInclude() {
  return {
    assignment: {
      include: {
        faculty: { include: { department: true } },
        subject: { include: { department: true } },
      },
    },
    records: true,
  };
}

async function getOwnedSession(sessionId, facultyId) {
  const id = parseInt(sessionId, 10);
  if (!id) {
    throw new AttendanceError("Invalid session id");
  }

  const session = await prisma.attendanceSession.findUnique({
    where: { id },
    include: sessionInclude(),
  });

  assertOwnedSession(session, facultyId);
  return expireSessionIfNeeded(session);
}

function mapAssignment(assignment) {
  const subject = assignment.subject;
  const deptCode = subject.department?.code || subject.departmentCode || IT_DEPARTMENT_CODE;
  const deptName = subject.department?.name || "Information Technology";
  const division = assignment.division || null;

  return {
    id: assignment.id,
    subjectId: subject.id,
    subjectCode: subject.subjectCode,
    subjectName: subject.subjectName,
    subjectType: subject.subjectType,
    academicYear: assignment.academicYear,
    semester: subject.semester,
    year: subject.year,
    yearLabel: yearLabel(subject.year),
    division,
    sectionLabel: formatSectionLabel(division),
    batchLabel: formatBatchLabel({
      year: subject.year,
      semester: subject.semester,
      division,
      academicYear: assignment.academicYear,
      departmentCode: deptCode,
    }),
    departmentCode: deptCode,
    departmentName: deptName,
    departmentLabel: IT_DEPARTMENT_LABEL,
  };
}

async function listFacultyAssignments(userId) {
  const faculty = await getFacultyContext(userId);
  assertItFaculty(faculty);

  const assignments = await prisma.facultySubjectAssignment.findMany({
    where: { facultyId: faculty.id },
    include: {
      subject: { include: { department: true } },
    },
    orderBy: [{ academicYear: "desc" }, { id: "asc" }],
  });

  const itAssignments = assignments
    .filter((assignment) => {
      const code = assignment.subject.department?.code || assignment.subject.departmentCode;
      const name = assignment.subject.department?.name;
      return isItDepartment(code, name);
    })
    .map(mapAssignment);

  return {
    faculty: {
      id: faculty.id,
      name: faculty.user?.name,
      employeeId: faculty.employeeId,
      departmentCode: faculty.department?.code || IT_DEPARTMENT_CODE,
      departmentName: faculty.department?.name || faculty.departmentName,
      departmentLabel: IT_DEPARTMENT_LABEL,
    },
    assignments: itAssignments,
  };
}

async function getAssignmentForFaculty(faculty, assignmentId) {
  const id = parseInt(assignmentId, 10);
  if (!id) {
    throw new AttendanceError("A valid subject assignment is required");
  }

  const assignment = await prisma.facultySubjectAssignment.findUnique({
    where: { id },
    include: {
      subject: { include: { department: true } },
      faculty: { include: { department: true } },
    },
  });

  if (!assignment || assignment.facultyId !== faculty.id) {
    throw new AttendanceError("You are not assigned to the selected class and subject", 403);
  }

  const code = assignment.subject.department?.code || assignment.subject.departmentCode;
  const name = assignment.subject.department?.name;
  if (!isItDepartment(code, name)) {
    throw new AttendanceError(
      "Attendance is currently available only for the Information Technology (IT) department.",
      403
    );
  }

  return assignment;
}

function eligibleStudentWhere(assignment, division) {
  const subject = assignment.subject;
  const resolvedDivision = normalizeDivision(division) || assignment.division || null;

  const studentFilter = {
    enrollmentStatus: "ACTIVE",
    academicYear: assignment.academicYear,
    year: subject.year,
    semester: subject.semester,
    OR: [
      { department: { code: IT_DEPARTMENT_CODE } },
      { departmentCode: IT_DEPARTMENT_CODE },
      { departmentName: { contains: "Information Technology", mode: "insensitive" } },
    ],
  };

  if (resolvedDivision && resolvedDivision !== "ALL") {
    studentFilter.division = resolvedDivision;
  }

  return {
    subjectId: subject.id,
    academicYear: assignment.academicYear,
    status: "ACTIVE",
    student: studentFilter,
  };
}

async function listEligibleStudents(userId, { assignmentId, division }) {
  const faculty = await getFacultyContext(userId);
  assertItFaculty(faculty);
  const assignment = await getAssignmentForFaculty(faculty, assignmentId);

  const enrollments = await prisma.studentSubjectEnrollment.findMany({
    where: eligibleStudentWhere(assignment, division),
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { student: { rollNo: "asc" } },
  });

  return {
    assignment: mapAssignment(assignment),
    students: enrollments.map((enrollment) => ({
      id: enrollment.student.id,
      userId: enrollment.student.userId,
      name: enrollment.student.user?.name || "Unknown student",
      rollNo: enrollment.student.rollNo != null ? enrollment.student.rollNo : "",
      enrollmentNo: enrollment.student.enrollmentNo || "",
      studentId: enrollment.student.studentId,
      division: enrollment.student.division
        ? String(enrollment.student.division).toUpperCase().startsWith("DIV")
          ? enrollment.student.division
          : `Div ${enrollment.student.division}`
        : "",
      rawDivision: enrollment.student.division,
      year: enrollment.student.year,
      semester: enrollment.student.semester,
      academicYear: enrollment.student.academicYear,
    })),
  };
}

async function listClassStudents(userId, { year, semester, division, department, academicYear, assignmentId } = {}) {
  const faculty = await getFacultyContext(userId);
  assertItFaculty(faculty);

  let targetYear = year;
  let targetSemester = semester ? parseInt(semester, 10) : undefined;
  let targetAcademicYear = academicYear;
  let targetAssignment = null;

  if (assignmentId) {
    targetAssignment = await getAssignmentForFaculty(faculty, assignmentId);
    targetYear = targetYear || targetAssignment.subject.year;
    targetSemester = targetSemester || targetAssignment.subject.semester;
    targetAcademicYear = targetAcademicYear || targetAssignment.academicYear;
  } else {
    const facultyAssignments = await prisma.facultySubjectAssignment.findMany({
      where: { facultyId: faculty.id },
      include: { subject: { include: { department: true } } },
    });

    const itAssignments = facultyAssignments.filter((a) => {
      const code = a.subject.department?.code || a.subject.departmentCode;
      const name = a.subject.department?.name;
      return isItDepartment(code, name);
    });

    if (itAssignments.length === 0) {
      throw new AttendanceError("You have no assigned classes in the IT department.", 403);
    }

    if (targetYear || targetSemester) {
      const hasMatch = itAssignments.some((a) => {
        const matchesYear = !targetYear || a.subject.year === targetYear;
        const matchesSem = !targetSemester || a.subject.semester === targetSemester;
        return matchesYear && matchesSem;
      });
      if (!hasMatch) {
        throw new AttendanceError("You are not authorized to access students for this class.", 403);
      }
    }
  }

  const resolvedDivision = normalizeDivision(division);

  const studentFilter = {
    enrollmentStatus: "ACTIVE",
    OR: [
      { department: { code: IT_DEPARTMENT_CODE } },
      { departmentCode: IT_DEPARTMENT_CODE },
      { departmentName: { contains: "Information Technology", mode: "insensitive" } },
    ],
  };

  if (targetYear) {
    studentFilter.year = targetYear;
  }
  if (targetSemester) {
    studentFilter.semester = targetSemester;
  }
  if (targetAcademicYear) {
    studentFilter.academicYear = targetAcademicYear;
  }
  if (resolvedDivision && resolvedDivision !== "ALL") {
    studentFilter.division = resolvedDivision;
  }

  const students = await prisma.studentProfile.findMany({
    where: studentFilter,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      rollNo: "asc",
    },
  });

  return {
    assignment: targetAssignment ? mapAssignment(targetAssignment) : null,
    count: students.length,
    students: students.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      rollNo: s.rollNo != null ? s.rollNo : "",
      division: s.division ? (String(s.division).toUpperCase().startsWith("DIV") ? s.division : `Div ${s.division}`) : "",
      rawDivision: s.division,
      year: s.year,
      semester: s.semester,
      academicYear: s.academicYear,
      name: s.user?.name || "Unknown student",
      userId: s.userId,
      enrollmentNo: s.enrollmentNo || "",
    })),
  };
}

function buildSessionPayload(session, extra = {}) {
  const now = new Date();
  const assignment = session.assignment ? mapAssignment(session.assignment) : null;
  const remainingMs = session.expiresAt ? new Date(session.expiresAt).getTime() - now.getTime() : 0;
  const status = effectiveStatus(session, now);

  return {
    id: session.id,
    assignmentId: session.assignmentId,
    academicYear: session.academicYear,
    year: session.year,
    division: session.division,
    sessionDate: session.sessionDate,
    attendanceType: session.attendanceType,
    sessionType: session.sessionType,
    lectureTime: session.lectureTime,
    status,
    persistedStatus: session.status,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    completedAt: session.completedAt,
    windowDurationSeconds: session.windowDurationSeconds,
    remainingSeconds: status === "ACTIVE" ? Math.max(0, Math.floor(remainingMs / 1000)) : 0,
    serverTime: now.toISOString(),
    assignment,
    ...extra,
  };
}

async function getEligibleCount(assignment, division) {
  return prisma.studentSubjectEnrollment.count({
    where: eligibleStudentWhere(assignment, division),
  });
}

async function getSessionStats(session) {
  const total = await getEligibleCount(session.assignment, session.division);
  const marked = session.records?.length
    ? session.records.length
    : await prisma.attendanceRecord.count({ where: { sessionId: session.id } });
  const present = (session.records || []).filter((record) => record.status === "PRESENT").length;
  const absent = (session.records || []).filter((record) => record.status === "ABSENT").length;

  return {
    total,
    marked,
    missing: Math.max(0, total - marked),
    present,
    absent,
  };
}

async function createSession(userId, payload) {
  const faculty = await getFacultyContext(userId);
  assertItFaculty(faculty);

  const assignment = await getAssignmentForFaculty(faculty, payload.assignmentId);
  const division = normalizeDivision(payload.division) || assignment.division || "ALL";

  const sessionDate = parseSessionDate(payload.date);
  const windowDurationSeconds = DEFAULT_WINDOW_SECONDS;

  const activeDuplicate = await prisma.attendanceSession.findFirst({
    where: {
      assignmentId: assignment.id,
      division,
      sessionDate,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    include: sessionInclude(),
  });

  if (activeDuplicate) {
    const err = new AttendanceError("An attendance window is already active for this class", 409);
    err.session = buildSessionPayload(activeDuplicate, {
      stats: await getSessionStats(activeDuplicate),
    });
    throw err;
  }

  const existingOpen = await prisma.attendanceSession.findFirst({
    where: {
      assignmentId: assignment.id,
      division,
      sessionDate,
      status: "NOT_STARTED",
    },
    include: sessionInclude(),
    orderBy: { createdAt: "desc" },
  });

  if (existingOpen) {
    const updated = await prisma.attendanceSession.update({
      where: { id: existingOpen.id },
      data: {
        attendanceType: payload.attendanceType || existingOpen.attendanceType,
        sessionType: payload.sessionType || existingOpen.sessionType,
        lectureTime: payload.lectureTime || existingOpen.lectureTime,
      },
      include: sessionInclude(),
    });
    return buildSessionPayload(updated, { stats: await getSessionStats(updated) });
  }

  const created = await prisma.attendanceSession.create({
    data: {
      assignmentId: assignment.id,
      academicYear: assignment.academicYear,
      year: assignment.subject.year,
      division,
      sessionDate,
      status: "NOT_STARTED",
      attendanceType: payload.attendanceType || null,
      sessionType: payload.sessionType || null,
      lectureTime: payload.lectureTime || null,
      windowDurationSeconds,
    },
    include: sessionInclude(),
  });

  return buildSessionPayload(created, { stats: await getSessionStats(created) });
}

async function startSession(userId, sessionId) {
  const faculty = await getFacultyContext(userId);
  assertItFaculty(faculty);
  const session = await getOwnedSession(sessionId, faculty.id);
  const now = new Date();

  if (session.status === "COMPLETED" || isExpired(session, now)) {
    throw new AttendanceError("This attendance window has already expired or been completed", 409);
  }

  if (session.status === "ACTIVE" && !isExpired(session, now)) {
    return buildSessionPayload(session, { stats: await getSessionStats(session) });
  }

  const otherActive = await prisma.attendanceSession.findFirst({
    where: {
      assignment: { facultyId: faculty.id },
      status: "ACTIVE",
      expiresAt: { gt: now },
      id: { not: session.id },
    },
  });

  if (otherActive) {
    throw new AttendanceError("Another attendance window is already active. Complete or wait for it to expire.", 409);
  }

  const expiresAt = new Date(now.getTime() + (session.windowDurationSeconds || DEFAULT_WINDOW_SECONDS) * 1000);
  const started = await prisma.attendanceSession.update({
    where: { id: session.id },
    data: {
      status: "ACTIVE",
      startedAt: now,
      expiresAt,
    },
    include: sessionInclude(),
  });

  return buildSessionPayload(started, { stats: await getSessionStats(started) });
}

async function getActiveSession(userId) {
  const faculty = await getFacultyContext(userId);
  assertItFaculty(faculty);

  const session = await prisma.attendanceSession.findFirst({
    where: {
      assignment: { facultyId: faculty.id },
      status: "ACTIVE",
    },
    include: sessionInclude(),
    orderBy: { startedAt: "desc" },
  });

  if (!session) return null;

  const current = await expireSessionIfNeeded(session);
  if (effectiveStatus(current) !== "ACTIVE") return null;
  return buildSessionPayload(current, { stats: await getSessionStats(current) });
}

async function getSession(userId, sessionId) {
  const faculty = await getFacultyContext(userId);
  assertItFaculty(faculty);
  const session = await getOwnedSession(sessionId, faculty.id);
  return buildSessionPayload(session, { stats: await getSessionStats(session) });
}

async function getSessionStudents(userId, sessionId) {
  const faculty = await getFacultyContext(userId);
  assertItFaculty(faculty);
  const session = await getOwnedSession(sessionId, faculty.id);
  const { students } = await listEligibleStudents(userId, {
    assignmentId: session.assignmentId,
    division: session.division,
  });

  const recordsByStudent = new Map((session.records || []).map((record) => [record.studentId, record]));

  return {
    session: buildSessionPayload(session, { stats: await getSessionStats(session) }),
    students: students.map((student) => {
      const record = recordsByStudent.get(student.id);
      return {
        ...student,
        status: record?.status || null,
        markedAt: record?.markedAt || null,
        recordId: record?.id || null,
      };
    }),
  };
}

function normalizeRecordStatus(status) {
  const value = String(status || "").toUpperCase();
  if (value === "PRESENT" || value === "LATE") return "PRESENT";
  if (value === "ABSENT" || value === "EXCUSED") return "ABSENT";
  throw new AttendanceError("Attendance status must be PRESENT or ABSENT");
}

async function saveRecords(userId, sessionId, records) {
  const faculty = await getFacultyContext(userId);
  assertItFaculty(faculty);
  const session = await getOwnedSession(sessionId, faculty.id);
  const now = new Date();

  if (session.status !== "ACTIVE" || isExpired(session, now)) {
    throw new AttendanceError("Attendance cannot be submitted because the window is not active or has expired", 409);
  }

  if (!Array.isArray(records) || records.length === 0) {
    throw new AttendanceError("At least one attendance record is required");
  }

  const { students } = await listEligibleStudents(userId, {
    assignmentId: session.assignmentId,
    division: session.division,
  });
  const eligibleIds = new Set(students.map((student) => student.id));

  const payload = records.map((record) => {
    const studentId = parseInt(record.studentId, 10);
    if (!studentId || !eligibleIds.has(studentId)) {
      throw new AttendanceError("One or more students are not eligible for this class", 403);
    }
    return {
      studentId,
      status: normalizeRecordStatus(record.status),
    };
  });

  await prisma.$transaction(
    payload.map((record) =>
      prisma.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId: session.id,
            studentId: record.studentId,
          },
        },
        update: {
          status: record.status,
          markedAt: now,
        },
        create: {
          sessionId: session.id,
          studentId: record.studentId,
          status: record.status,
          markedAt: now,
        },
      })
    )
  );

  const updated = await getOwnedSession(session.id, faculty.id);
  return buildSessionPayload(updated, { stats: await getSessionStats(updated) });
}

async function completeSession(userId, sessionId) {
  const faculty = await getFacultyContext(userId);
  assertItFaculty(faculty);
  const session = await getOwnedSession(sessionId, faculty.id);
  const now = new Date();

  if (session.status === "NOT_STARTED") {
    throw new AttendanceError("Cannot complete an attendance session that has not been started");
  }

  const completed = await prisma.attendanceSession.update({
    where: { id: session.id },
    data: {
      status: "COMPLETED",
      completedAt: session.completedAt || now,
    },
    include: sessionInclude(),
  });

  return buildSessionPayload(completed, { stats: await getSessionStats(completed) });
}

function matchesHistoryFilters(session, filters) {
  if (filters.type && filters.type !== "All") {
    const type = filters.type.toLowerCase();
    const sessionType = `${session.sessionType || ""} ${session.attendanceType || ""}`.toLowerCase();
    if (!sessionType.includes(type.toLowerCase())) return false;
  }
  if (filters.subject && filters.subject !== "All") {
    const subjectName = session.assignment?.subjectName || "";
    if (subjectName !== filters.subject) return false;
  }
  if (filters.batch && filters.batch !== "All") {
    const batch = session.assignment?.batchLabel || "";
    if (batch !== filters.batch) return false;
  }
  return true;
}

async function listHistory(userId, filters = {}) {
  const faculty = await getFacultyContext(userId);
  assertItFaculty(faculty);

  const where = {
    assignment: { facultyId: faculty.id },
  };

  if (filters.from || filters.to) {
    where.sessionDate = {};
    if (filters.from) where.sessionDate.gte = parseSessionDate(filters.from);
    if (filters.to) where.sessionDate.lte = parseSessionDate(filters.to);
  }

  const sessions = await prisma.attendanceSession.findMany({
    where,
    include: {
      ...sessionInclude(),
      _count: { select: { records: true } },
    },
    orderBy: [{ sessionDate: "desc" }, { createdAt: "desc" }],
  });

  const rows = [];
  for (const raw of sessions) {
    const session = await expireSessionIfNeeded(raw);
    const mapped = buildSessionPayload(session);
    if (!matchesHistoryFilters(mapped, filters)) continue;
    const stats = await getSessionStats(session);
    rows.push({
      id: session.id,
      date: session.sessionDate,
      type: session.sessionType || session.attendanceType || "Lecture",
      subject: mapped.assignment?.subjectName || "",
      batch: mapped.assignment?.batchLabel || `${mapped.year} ${mapped.division}`,
      time: session.lectureTime || "",
      status: mapped.status,
      academicYear: session.academicYear,
      semester: mapped.assignment?.semester,
      division: session.division,
      total: stats.total,
      present: stats.present,
      absent: stats.absent,
      marked: stats.marked,
      missing: stats.missing,
      room: "",
    });
  }

  const lectures = rows.filter((row) => /lecture/i.test(row.type)).length;
  const labs = rows.filter((row) => /lab/i.test(row.type)).length;
  const presentTotal = rows.reduce((sum, row) => sum + row.present, 0);
  const markedTotal = rows.reduce((sum, row) => sum + row.marked, 0);

  return {
    sessions: rows,
    summary: {
      totalSessions: rows.length,
      averageAttendance: markedTotal ? Number(((presentTotal / markedTotal) * 100).toFixed(1)) : 0,
      lecturesConducted: lectures,
      labSessions: labs,
    },
  };
}

module.exports = {
  AttendanceError,
  IT_DEPARTMENT_LABEL,
  listFacultyAssignments,
  listEligibleStudents,
  listClassStudents,
  createSession,
  startSession,
  getActiveSession,
  getSession,
  getSessionStudents,
  saveRecords,
  completeSession,
  listHistory,
};
