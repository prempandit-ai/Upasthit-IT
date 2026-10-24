const prisma = require("../config/prisma");
const {
  sessionIsLab,
  studentMatchesSession,
  verifyJoinCode,
  buildAttendanceSummary,
} = require("../utils/studentAttendance.logic");

const failedCheckInAttempts = new Map();

class StudentAttendanceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function getStudentAttendanceSummary(userId) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      division: true,
      labBatch: true,
      subjectEnrollments: {
        select: {
          subjectId: true,
          academicYear: true,
          status: true,
          subject: { select: { id: true, subjectName: true, subjectCode: true, year: true, semester: true } },
        },
      },
    },
  });
  if (!profile) throw new StudentAttendanceError("Student profile not found", 404);

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: { studentId: profile.id, session: { status: "COMPLETED" } },
    include: {
      session: {
        include: {
          assignment: {
            include: {
              subject: true,
              faculty: { include: { user: { select: { name: true } } } },
            },
          },
        },
      },
    },
    orderBy: [{ session: { sessionDate: "desc" } }, { markedAt: "desc" }],
  });

  const enrollments = profile.subjectEnrollments;
  const academicYears = [...new Set(enrollments.map((item) => item.academicYear))];
  const subjectIds = [...new Set(enrollments.map((item) => item.subjectId))];
  const possibleSessions = academicYears.length && subjectIds.length
    ? await prisma.attendanceSession.findMany({
        where: {
          status: "COMPLETED",
          assignment: { academicYear: { in: academicYears }, subjectId: { in: subjectIds } },
        },
        include: {
          assignment: {
            include: {
              subject: true,
              faculty: { include: { user: { select: { name: true } } } },
            },
          },
        },
      })
    : [];

  return buildAttendanceSummary(profile, possibleSessions, attendanceRecords);
}

async function getStudentProfileForSession(userId) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { user: { select: { role: true, status: true, isActive: true } } },
  });
  if (!profile || profile.user?.role !== "STUDENT" || profile.user.status !== "APPROVED" || !profile.user.isActive) {
    throw new StudentAttendanceError("An active, approved student account is required", 403);
  }
  if (profile.enrollmentStatus !== "ACTIVE") {
    throw new StudentAttendanceError("Your student profile is not active", 403);
  }
  return profile;
}

async function hasActiveSubjectEnrollment(client, profileId, session) {
  return Boolean(await client.studentSubjectEnrollment.findFirst({
    where: {
      studentId: profileId,
      subjectId: session.assignment.subjectId,
      academicYear: session.academicYear,
      status: "ACTIVE",
    },
    select: { id: true },
  }));
}

function facultyIsAuthorized(session) {
  const user = session.assignment?.faculty?.user;
  return Boolean(
    user &&
    session.assignment?.faculty?.id === session.assignment?.facultyId &&
    user.status === "APPROVED" &&
    user.isActive
  );
}

function mapActiveSession(session) {
  const now = new Date();
  return {
    id: session.id,
    status: "ACTIVE",
    sessionDate: session.sessionDate,
    attendanceType: session.attendanceType,
    sessionType: session.sessionType,
    division: session.division,
    labBatch: session.labBatch || null,
    academicYear: session.academicYear,
    year: session.year,
    semester: session.assignment.subject.semester,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    remainingSeconds: Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - now.getTime()) / 1000)),
    serverTime: now.toISOString(),
    subject: {
      id: session.assignment.subject.id,
      code: session.assignment.subject.subjectCode,
      name: session.assignment.subject.subjectName,
    },
    faculty: session.assignment.faculty.user.name,
  };
}

async function listActiveSessions(userId) {
  const profile = await getStudentProfileForSession(userId);
  const now = new Date();
  const sessions = await prisma.attendanceSession.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gt: now },
      joinCode: { not: null },
      academicYear: profile.academicYear,
      year: profile.year,
      assignment: { academicYear: profile.academicYear, subject: { semester: profile.semester } },
    },
    include: {
      assignment: {
        include: {
          subject: true,
          faculty: { include: { user: { select: { name: true, status: true, isActive: true } } } },
        },
      },
      records: { where: { studentId: profile.id }, select: { id: true, status: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  const eligible = [];
  for (const session of sessions) {
    if (!studentMatchesSession(profile, session) || !facultyIsAuthorized(session)) continue;
    if (!await hasActiveSubjectEnrollment(prisma, profile.id, session)) continue;
    eligible.push({ ...mapActiveSession(session), attendanceStatus: session.records[0]?.status || null });
  }
  return eligible;
}

async function checkIn(userId, sessionId, code) {
  const profile = await getStudentProfileForSession(userId);
  const id = Number.parseInt(sessionId, 10);
  if (!Number.isInteger(id) || id <= 0) throw new StudentAttendanceError("Invalid attendance session", 400);
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    throw new StudentAttendanceError("Enter the six-digit attendance code", 400);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const session = await tx.attendanceSession.findUnique({
        where: { id },
        include: {
          assignment: {
            include: {
              subject: true,
              faculty: { include: { user: { select: { name: true, status: true, isActive: true } } } },
            },
          },
          records: { where: { studentId: profile.id }, select: { id: true, status: true } },
        },
      });
      if (!session) throw new StudentAttendanceError("Attendance session not found", 404);
      if (session.status !== "ACTIVE" || !session.expiresAt || new Date(session.expiresAt) <= new Date()) {
        throw new StudentAttendanceError("This attendance window has expired or is no longer active", 409);
      }
      if (!studentMatchesSession(profile, session)) {
        throw new StudentAttendanceError("You are not eligible for this class, division, or lab batch", 403);
      }
      if (!facultyIsAuthorized(session)) {
        throw new StudentAttendanceError("The assigned faculty account is no longer authorized for attendance", 403);
      }
      if (!await hasActiveSubjectEnrollment(tx, profile.id, session)) {
        throw new StudentAttendanceError("You are not actively enrolled in this subject", 403);
      }
      const attemptKey = `${profile.id}:${id}`;
      const attempts = failedCheckInAttempts.get(attemptKey);
      const now = Date.now();
      if (attempts && attempts.lockedUntil > now) {
        throw new StudentAttendanceError("Too many incorrect attendance codes. Try again after the attendance window ends.", 429);
      }
      if (attempts && (attempts.lockedUntil && attempts.lockedUntil <= now || now - attempts.lastAttemptAt > 10 * 60 * 1000)) {
        failedCheckInAttempts.delete(attemptKey);
      }
      if (!verifyJoinCode(session.joinCode, code)) {
        const nextAttempts = (failedCheckInAttempts.get(attemptKey)?.count || 0) + 1;
        failedCheckInAttempts.set(attemptKey, {
          count: nextAttempts,
          lockedUntil: nextAttempts >= 5 ? new Date(session.expiresAt).getTime() : 0,
          lastAttemptAt: now,
        });
        if (failedCheckInAttempts.size > 10000) {
          for (const [key, value] of failedCheckInAttempts) {
            if ((value.lockedUntil && value.lockedUntil <= now) || now - value.lastAttemptAt > 10 * 60 * 1000) {
              failedCheckInAttempts.delete(key);
            }
          }
        }
        if (nextAttempts >= 5) {
          throw new StudentAttendanceError("Too many incorrect attendance codes. Try again after the attendance window ends.", 429);
        }
        throw new StudentAttendanceError("The attendance code is incorrect", 401);
      }
      failedCheckInAttempts.delete(attemptKey);

      const existing = session.records[0];
      if (existing?.status === "PRESENT") {
        return { sessionId: id, status: "PRESENT", alreadyCheckedIn: true, checkedInAt: null };
      }
      if (existing) {
        throw new StudentAttendanceError("Attendance has already been marked for this session. Contact faculty if it needs correction.", 409);
      }
      const record = await tx.attendanceRecord.create({
        data: { sessionId: id, studentId: profile.id, status: "PRESENT" },
        select: { id: true, status: true, markedAt: true },
      });
      return { sessionId: id, status: record.status, alreadyCheckedIn: false, checkedInAt: record.markedAt };
    });
  } catch (error) {
    // The database's unique (sessionId, studentId) constraint is the final concurrency guard.
    if (error.code === "P2002") {
      const existing = await prisma.attendanceRecord.findUnique({
        where: { sessionId_studentId: { sessionId: id, studentId: profile.id } },
        select: { status: true, markedAt: true },
      });
      if (existing?.status === "PRESENT") {
        return { sessionId: id, status: "PRESENT", alreadyCheckedIn: true, checkedInAt: existing.markedAt };
      }
      if (existing) {
        throw new StudentAttendanceError("Attendance has already been marked for this session. Contact faculty if it needs correction.", 409);
      }
    }
    throw error;
  }
}

module.exports = { StudentAttendanceError, getStudentAttendanceSummary, listActiveSessions, checkIn };
