const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildAttendanceSummary,
  isApplicableUnmarkedSession,
  studentMatchesSession,
  verifyJoinCode,
} = require("../src/utils/studentAttendance.logic");

function makeSession(overrides = {}) {
  return {
    id: 1,
    academicYear: "2026-27",
    year: "BE",
    division: "A",
    sessionDate: new Date("2026-10-23T00:00:00.000Z"),
    sessionType: "Lecture",
    labBatch: null,
    lectureTime: "09:00-10:00",
    assignment: {
      id: 10,
      subjectId: 20,
      academicYear: "2026-27",
      division: "A",
      subject: { id: 20, subjectName: "Networks", subjectCode: "IT401", year: "BE", semester: 7 },
      faculty: { user: { name: "Assigned Faculty" } },
    },
    ...overrides,
  };
}

function makeProfile(overrides = {}) {
  return {
    id: 30,
    academicYear: "2026-27",
    year: "BE",
    semester: 7,
    division: "Div A",
    labBatch: "A1",
    subjectEnrollments: [{
      subjectId: 20,
      academicYear: "2026-27",
      status: "ACTIVE",
      subject: { id: 20, year: "BE", semester: 7 },
    }],
    ...overrides,
  };
}

test("lecture eligibility uses academic group and division without lab batch filtering", () => {
  const profile = makeProfile({ labBatch: "A3" });
  assert.equal(studentMatchesSession(profile, makeSession()), true);
  assert.equal(studentMatchesSession(profile, makeSession({ division: "B" })), false);
  assert.equal(studentMatchesSession(profile, makeSession({ academicYear: "2025-26" })), false);
});

test("lab eligibility requires a valid batch for the selected division and saved membership", () => {
  const lab = makeSession({ sessionType: "Lab Session", labBatch: "A2" });
  assert.equal(studentMatchesSession(makeProfile({ labBatch: "A2" }), lab), true);
  assert.equal(studentMatchesSession(makeProfile({ labBatch: "A1" }), lab), false);
  assert.equal(studentMatchesSession(makeProfile({ labBatch: "B2" }), lab), false);
  assert.equal(studentMatchesSession(makeProfile({ labBatch: "A2" }), makeSession({ sessionType: "Lab Session", labBatch: "B2" })), false);
});

test("completed-session summary uses recorded statuses and reports unmarked sessions separately", () => {
  const completed = makeSession();
  const unmarked = makeSession({ id: 2, sessionDate: new Date("2026-10-22T00:00:00.000Z") });
  const record = {
    id: 50,
    sessionId: completed.id,
    status: "PRESENT",
    markedAt: new Date("2026-10-23T00:05:00.000Z"),
    session: completed,
  };
  const result = buildAttendanceSummary(makeProfile(), [completed, unmarked], [record]);
  assert.equal(result.totalApplicableSessions, 2);
  assert.equal(result.totalPresent, 1);
  assert.equal(result.totalAbsent, 0);
  assert.equal(result.unmarkedCount, 1);
  assert.equal(result.overallPercentage, 100);
  assert.equal(result.history.length, 1);
  assert.equal(result.history[0].faculty, "Assigned Faculty");
});

test("historical attendance records remain readable after a division change", () => {
  const historical = makeSession({ division: "B", labBatch: "B1", sessionType: "Lab Session" });
  const record = {
    id: 51,
    sessionId: historical.id,
    status: "ABSENT",
    markedAt: new Date("2026-10-23T00:05:00.000Z"),
    session: historical,
  };
  const result = buildAttendanceSummary(makeProfile({ division: "A" }), [], [record]);
  assert.equal(result.totalAbsent, 1);
  assert.equal(result.history[0].division, "B");
  assert.equal(result.history[0].labBatch, "B1");
});

test("unmarked-session denominator excludes dropped enrollments", () => {
  const dropped = makeProfile({ subjectEnrollments: [{
    subjectId: 20,
    academicYear: "2026-27",
    status: "DROPPED",
    subject: { id: 20, year: "BE", semester: 7 },
  }] });
  assert.equal(isApplicableUnmarkedSession(makeSession(), dropped, dropped.subjectEnrollments), false);
});

test("attendance codes must be exact six-digit values", () => {
  assert.equal(verifyJoinCode("004281", "004281"), true);
  assert.equal(verifyJoinCode("004281", "004280"), false);
  assert.equal(verifyJoinCode("4281", "004281"), false);
  assert.equal(verifyJoinCode("004281", "42abcd"), false);
});
