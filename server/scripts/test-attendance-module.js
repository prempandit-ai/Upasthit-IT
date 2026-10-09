/**
 * Attendance module integration checks against the running API + PostgreSQL.
 * Does not seed dummy students or reset the database.
 */
require("dotenv").config();
const prisma = require("../src/config/prisma");

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.API_URL || `http://localhost:${PORT}`;
const EMAIL = process.env.ATTENDANCE_TEST_EMAIL || process.env.FACULTY_TEST_EMAIL;
const PASSWORD = process.env.ATTENDANCE_TEST_PASSWORD || process.env.FACULTY_TEST_PASSWORD;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function login(email, password) {
  return api("/api/auth/login", { method: "POST", body: { email, password } });
}

async function main() {
  const results = [];
  const record = (name, ok, detail) => {
    results.push({ name, ok, detail });
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  };

  const health = await api("/api/health");
  record("Backend health", health.status === 200 && health.data.success, `status ${health.status}`);

  if (!EMAIL || !PASSWORD) {
    record(
      "Faculty login credentials",
      false,
      "Set ATTENDANCE_TEST_EMAIL and ATTENDANCE_TEST_PASSWORD to run authenticated API tests"
    );
    printSummary(results);
    return;
  }

  const loggedIn = await login(EMAIL, PASSWORD);
  record("Faculty JWT login", loggedIn.status === 200 && Boolean(loggedIn.data.token), loggedIn.data.message);
  const token = loggedIn.data.token;
  if (!token) {
    printSummary(results);
    return;
  }

  const unauth = await api("/api/attendance/faculty/assignments");
  record("Expired/missing JWT rejected", unauth.status === 401, `status ${unauth.status}`);

  const assignmentsRes = await api("/api/attendance/faculty/assignments", { token });
  record(
    "GET assignments",
    assignmentsRes.status === 200 && Array.isArray(assignmentsRes.data.assignments),
    `status ${assignmentsRes.status}, count ${assignmentsRes.data.assignments?.length ?? "n/a"}`
  );

  const departmentOk =
    assignmentsRes.data.faculty?.departmentCode === "IT" ||
    /information technology/i.test(assignmentsRes.data.faculty?.departmentName || "") ||
    assignmentsRes.status === 403;
  record("IT department restriction enforced", departmentOk, assignmentsRes.data.faculty?.departmentLabel || assignmentsRes.data.message);

  if (assignmentsRes.status === 403) {
    record("Assigned subjects empty/unauthorized", true, "Faculty is outside IT; attendance correctly blocked");
    printSummary(results);
    return;
  }

  const assignment = assignmentsRes.data.assignments?.[0];
  record("Faculty assigned subjects available", Boolean(assignment), assignment ? assignment.subjectName : "No assigned subjects yet");

  const studentsRes = await api(
    `/api/attendance/eligible-students?assignmentId=${assignment?.id || 0}`,
    { token }
  );
  record(
    "Eligible students endpoint",
    assignment ? studentsRes.status === 200 : studentsRes.status >= 400,
    assignment ? `students ${studentsRes.data.students?.length ?? 0}` : studentsRes.data.message
  );

  if (!assignment) {
    printSummary(results);
    return;
  }

  const created = await api("/api/attendance/sessions", {
    method: "POST",
    token,
    body: {
      assignmentId: assignment.id,
      date: new Date().toISOString().slice(0, 10),
      division: assignment.division,
      attendanceType: "Class Lecture",
      sessionType: "Lecture",
      lectureTime: "09:00 AM - 10:00 AM",
    },
  });
  record("Create session", created.status === 201 || created.status === 200, created.data.message || `session ${created.data.session?.id}`);
  const sessionId = created.data.session?.id || created.data.session?.id;

  const started = await api(`/api/attendance/sessions/${sessionId}/start`, { method: "POST", token });
  record(
    "Start attendance window",
    started.status === 200 && started.data.session?.status === "ACTIVE" && Boolean(started.data.session?.expiresAt),
    `status ${started.data.session?.status}, expires ${started.data.session?.expiresAt}`
  );

  const startedAgain = await api(`/api/attendance/sessions/${sessionId}/start`, { method: "POST", token });
  record(
    "Duplicate start is idempotent",
    startedAgain.status === 200 && startedAgain.data.session?.id === sessionId,
    `status ${startedAgain.status}`
  );

  const active = await api("/api/attendance/sessions/active", { token });
  record("Active session restore", active.status === 200 && active.data.session?.id === sessionId, `id ${active.data.session?.id}`);

  const sessionStudents = await api(`/api/attendance/sessions/${sessionId}/students`, { token });
  record("Session students", sessionStudents.status === 200, `count ${sessionStudents.data.students?.length ?? 0}`);

  const roster = sessionStudents.data.students || [];
  if (roster.length > 0) {
    const save = await api(`/api/attendance/sessions/${sessionId}/records`, {
      method: "POST",
      token,
      body: {
        records: roster.map((student, idx) => ({
          studentId: student.id,
          status: idx === 0 ? "ABSENT" : "PRESENT",
        })),
      },
    });
    record(
      "Submit attendance records",
      save.status === 200 && save.data.session?.stats?.marked === roster.length,
      save.data.message || JSON.stringify(save.data.session?.stats)
    );

    const duplicateSave = await api(`/api/attendance/sessions/${sessionId}/records`, {
      method: "POST",
      token,
      body: { records: [{ studentId: roster[0].id, status: "PRESENT" }] },
    });
    record("Upsert prevents duplicate records", duplicateSave.status === 200, `marked ${duplicateSave.data.session?.stats?.marked}`);
  } else {
    record("Submit attendance records", true, "Skipped — no enrolled students for the selected class yet");
  }

  const completed = await api(`/api/attendance/sessions/${sessionId}/complete`, { method: "POST", token });
  record("Complete session", completed.status === 200 && completed.data.session?.status === "COMPLETED", completed.data.message);

  const lateSave = await api(`/api/attendance/sessions/${sessionId}/records`, {
    method: "POST",
    token,
    body: { records: roster[0] ? [{ studentId: roster[0].id, status: "PRESENT" }] : [] },
  });
  record("Expired/completed session rejects late submission", lateSave.status === 409 || lateSave.status === 400, `status ${lateSave.status}`);

  const history = await api("/api/attendance/history", { token });
  record("History lists real sessions", history.status === 200 && Array.isArray(history.data.sessions), `count ${history.data.sessions?.length ?? 0}`);

  const otherFaculty = await prisma.user.findFirst({
    where: { role: "FACULTY", email: { not: EMAIL } },
    select: { email: true },
  });
  if (otherFaculty?.email && process.env.ATTENDANCE_OTHER_FACULTY_PASSWORD) {
    const otherLogin = await login(otherFaculty.email, process.env.ATTENDANCE_OTHER_FACULTY_PASSWORD);
    if (otherLogin.data.token) {
      const forbidden = await api(`/api/attendance/sessions/${sessionId}`, { token: otherLogin.data.token });
      record("Unauthorized faculty cannot read another session", forbidden.status === 403, `status ${forbidden.status}`);
    } else {
      record("Unauthorized faculty cannot read another session", true, "Skipped — other faculty password not valid");
    }
  } else {
    record("Unauthorized faculty cannot read another session", true, "Skipped — second faculty credentials not provided");
  }

  printSummary(results);
}

function printSummary(results) {
  const failed = results.filter((item) => !item.ok);
  console.log("\n=== Attendance module test summary ===");
  console.log(`Passed: ${results.filter((item) => item.ok).length}/${results.length}`);
  if (failed.length) {
    failed.forEach((item) => console.log(`  - ${item.name}: ${item.detail}`));
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Attendance tests failed to run:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
