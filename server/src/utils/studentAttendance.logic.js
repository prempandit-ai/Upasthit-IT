const crypto = require("crypto");
const { normalizeDivision, isValidLabBatch } = require("./labBatch");

function sessionIsLab(session) {
  return Boolean(session.labBatch) || /lab/i.test(`${session.sessionType || ""} ${session.attendanceType || ""}`);
}

function percentage(present, marked) {
  return marked ? Number(((present / marked) * 100).toFixed(1)) : null;
}

function facultyName(assignment) {
  return assignment?.faculty?.user?.name || null;
}

function subjectPayload(subject, faculty) {
  return { id: String(subject.id), name: subject.subjectName, code: subject.subjectCode, faculty: faculty || null };
}

function isApplicableUnmarkedSession(session, profile, enrollments) {
  const assignment = session.assignment;
  const enrollment = enrollments.find((item) =>
    item.subjectId === assignment.subjectId &&
    item.academicYear === session.academicYear &&
    item.subject.year === session.year &&
    item.status !== "DROPPED"
  );
  if (!enrollment || normalizeDivision(session.division) !== normalizeDivision(profile.division)) return false;
  if (assignment.division && normalizeDivision(assignment.division) !== normalizeDivision(session.division)) return false;
  if (sessionIsLab(session) && (!isValidLabBatch(session.labBatch, session.division) || session.labBatch !== profile.labBatch)) return false;
  return true;
}

function studentMatchesSession(profile, session) {
  const assignment = session.assignment;
  const subject = assignment.subject;
  if (profile.academicYear !== session.academicYear) return false;
  if (assignment.academicYear !== session.academicYear || subject.year !== session.year) return false;
  if (assignment.division && normalizeDivision(assignment.division) !== normalizeDivision(session.division)) return false;
  if (profile.year !== session.year || profile.semester !== subject.semester) return false;
  if (normalizeDivision(profile.division) !== normalizeDivision(session.division)) return false;
  if (sessionIsLab(session) && (!isValidLabBatch(session.labBatch, session.division) || profile.labBatch !== session.labBatch)) return false;
  return true;
}

function verifyJoinCode(expected, provided) {
  if (typeof expected !== "string" || !/^\d{6}$/.test(expected)) return false;
  if (typeof provided !== "string" || !/^\d{6}$/.test(provided)) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

function buildAttendanceSummary(profile, possibleSessions, attendanceRecords) {
  const enrollments = profile.subjectEnrollments || [];
  const recordsBySession = new Map(attendanceRecords.map((record) => [record.sessionId, record]));
  const applicableSessions = new Map();
  for (const session of possibleSessions) {
    if (isApplicableUnmarkedSession(session, profile, enrollments) || recordsBySession.has(session.id)) {
      applicableSessions.set(session.id, session);
    }
  }
  // Keep historical records visible even if the student's current division or batch changed.
  for (const record of attendanceRecords) applicableSessions.set(record.sessionId, record.session);

  const subjectStats = new Map();
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalApplicableLectures = 0;
  let totalApplicableLabSessions = 0;
  const history = [];
  for (const session of applicableSessions.values()) {
    if (sessionIsLab(session)) totalApplicableLabSessions += 1;
    else totalApplicableLectures += 1;
    const subject = session.assignment.subject;
    const faculty = facultyName(session.assignment);
    const key = String(subject.id);
    if (!subjectStats.has(key)) {
      subjectStats.set(key, {
        ...subjectPayload(subject, faculty),
        present: 0,
        absent: 0,
        applicableSessions: 0,
      });
    }
    const stats = subjectStats.get(key);
    stats.applicableSessions += 1;
    const record = recordsBySession.get(session.id);
    if (!record) continue;
    if (record.status === "PRESENT") {
      stats.present += 1;
      totalPresent += 1;
    } else if (record.status === "ABSENT") {
      stats.absent += 1;
      totalAbsent += 1;
    }
    history.push({
      id: String(record.id),
      date: session.sessionDate,
      subject: subject.subjectName,
      subjectCode: subject.subjectCode,
      faculty,
      time: session.lectureTime || null,
      status: record.status,
      sessionType: session.sessionType || session.attendanceType || "Lecture",
      division: session.division,
      labBatch: session.labBatch || null,
      academicYear: session.academicYear,
      semester: subject.semester,
      year: session.year,
      markedAt: record.markedAt,
    });
  }

  const subjects = [...subjectStats.values()].map((item) => {
    const marked = item.present + item.absent;
    return { ...item, conducted: marked, percentage: percentage(item.present, marked), status: null };
  });
  const totalApplicableSessions = applicableSessions.size;
  const totalMarked = totalPresent + totalAbsent;
  return {
    overallPercentage: percentage(totalPresent, totalMarked),
    totalConducted: totalApplicableSessions,
    totalApplicableSessions,
    totalApplicableLectures,
    totalApplicableLabSessions,
    totalMarked,
    totalPresent,
    totalAbsent,
    unmarkedCount: Math.max(0, totalApplicableSessions - totalMarked),
    totalLate: 0,
    minimumRequired: null,
    status: null,
    attendanceBasis: "Percentage is PRESENT divided by recorded PRESENT + ABSENT. Unmarked completed sessions are reported separately and excluded from the percentage.",
    subjects,
    history: history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };
}

module.exports = {
  sessionIsLab,
  percentage,
  isApplicableUnmarkedSession,
  studentMatchesSession,
  verifyJoinCode,
  buildAttendanceSummary,
};
