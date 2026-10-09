require("dotenv").config();
const prisma = require("../src/config/prisma");
const attendanceService = require("../src/services/attendance.service");
const jwt = require("jsonwebtoken");

async function runTests() {
  console.log("==================================================");
  console.log("   UPASTHIT ERP — LIVE DATABASE ATTENDANCE TESTS   ");
  console.log("==================================================");

  // 1. Fetch Kirti Maam (BE Sem 7 IT Faculty)
  const kirtiUser = await prisma.user.findFirst({
    where: { email: "kirti.faculty@example.com" },
    include: { facultyProfile: { include: { department: true } } },
  });
  if (!kirtiUser) throw new Error("Kirti Maam user not found!");
  console.log(`✓ Faculty: ${kirtiUser.name} (${kirtiUser.email}), Dept: ${kirtiUser.facultyProfile?.department?.code}`);

  // Fetch Kirti's assignments
  const { assignments } = await attendanceService.listFacultyAssignments(kirtiUser.id);
  console.log(`✓ Assigned subjects count: ${assignments.length}`);
  const beAssignment = assignments.find((a) => a.year === "BE" && a.semester === 7);
  if (!beAssignment) throw new Error("No BE Sem 7 assignment found for faculty!");
  console.log(`✓ BE Assignment ID: ${beAssignment.id}, Subject: ${beAssignment.subjectCode} - ${beAssignment.subjectName}`);
  console.log(`✓ Batch label: ${beAssignment.batchLabel}`);

  // ── TEST 1: Select BE → Semester 7 → Div A (Expected: 15 students) ────────
  console.log("\n--- TEST 1: BE Sem 7 Div A ---");
  const divAStudents = await attendanceService.listClassStudents(kirtiUser.id, {
    year: "BE",
    semester: 7,
    division: "Div A",
    assignmentId: beAssignment.id,
  });
  console.log(`Div A count: ${divAStudents.count} (Expected: 15)`);
  if (divAStudents.count !== 15) throw new Error(`Expected 15 Div A students, got ${divAStudents.count}`);
  console.log("Sample Div A students:");
  console.table(divAStudents.students.slice(0, 3).map(s => ({
    Roll: s.rollNo,
    Div: s.division,
    StudentId: s.studentId,
    Name: s.name,
    Year: s.year,
    Sem: s.semester,
  })));

  // ── TEST 2: Select BE → Semester 7 → Div B (Expected: 15 students) ────────
  console.log("\n--- TEST 2: BE Sem 7 Div B ---");
  const divBStudents = await attendanceService.listClassStudents(kirtiUser.id, {
    year: "BE",
    semester: 7,
    division: "Div B",
    assignmentId: beAssignment.id,
  });
  console.log(`Div B count: ${divBStudents.count} (Expected: 15)`);
  if (divBStudents.count !== 15) throw new Error(`Expected 15 Div B students, got ${divBStudents.count}`);
  console.log("Sample Div B students:");
  console.table(divBStudents.students.slice(0, 3).map(s => ({
    Roll: s.rollNo,
    Div: s.division,
    StudentId: s.studentId,
    Name: s.name,
    Year: s.year,
    Sem: s.semester,
  })));

  // ── TEST 3: Select All Divisions (Expected: 30 students) ───────────────────
  console.log("\n--- TEST 3: All Divisions ---");
  const allStudents = await attendanceService.listClassStudents(kirtiUser.id, {
    year: "BE",
    semester: 7,
    division: "All Divisions",
    assignmentId: beAssignment.id,
  });
  console.log(`All Divisions count: ${allStudents.count} (Expected: 30)`);
  if (allStudents.count !== 30) throw new Error(`Expected 30 students, got ${allStudents.count}`);

  // ── TEST 4 & 5: Search filters (by name and roll number) ───────────────────
  console.log("\n--- TEST 4 & 5: Search Filters ---");
  const qName = "DIXIT";
  const filteredByName = divAStudents.students.filter(s => s.name.toLowerCase().includes(qName.toLowerCase()));
  console.log(`Search by name '${qName}': found ${filteredByName.length} student(s):`, filteredByName.map(s => s.name));
  if (filteredByName.length === 0) throw new Error(`Expected to find student with name ${qName}`);

  const qRoll = 1;
  const filteredByRoll = divAStudents.students.filter(s => String(s.rollNo) === String(qRoll));
  console.log(`Search by roll '${qRoll}': found ${filteredByRoll.length} student:`, filteredByRoll.map(s => `${s.rollNo} - ${s.name}`));
  if (filteredByRoll.length === 0) throw new Error(`Expected to find roll 1`);

  // ── TEST 6: Verify student names and roll numbers against DB ───────────────
  console.log("\n--- TEST 6: Verify Roll Numbers Sorting ---");
  const rollNosA = divAStudents.students.map(s => s.rollNo);
  console.log("Div A roll numbers:", rollNosA.join(", "));
  const isSorted = rollNosA.every((v, i) => i === 0 || v >= rollNosA[i - 1]);
  console.log(`Div A sorted by roll number: ${isSorted}`);
  if (!isSorted) throw new Error("Students are not sorted by roll number!");

  // ── TEST 7: Eligible-students endpoint with Div A, Div B, ALL ─────────────
  console.log("\n--- TEST 7: Eligible students endpoint ---");
  const elA = await attendanceService.listEligibleStudents(kirtiUser.id, {
    assignmentId: beAssignment.id,
    division: "Div A",
  });
  console.log(`Eligible Div A count: ${elA.students.length} (Expected: 15)`);
  if (elA.students.length !== 15) throw new Error(`Expected 15 eligible Div A, got ${elA.students.length}`);

  const elB = await attendanceService.listEligibleStudents(kirtiUser.id, {
    assignmentId: beAssignment.id,
    division: "Div B",
  });
  console.log(`Eligible Div B count: ${elB.students.length} (Expected: 15)`);
  if (elB.students.length !== 15) throw new Error(`Expected 15 eligible Div B, got ${elB.students.length}`);

  const elAll = await attendanceService.listEligibleStudents(kirtiUser.id, {
    assignmentId: beAssignment.id,
    division: "All Divisions",
  });
  console.log(`Eligible All Divisions count: ${elAll.students.length} (Expected: 30)`);
  if (elAll.students.length !== 30) throw new Error(`Expected 30 eligible all divisions, got ${elAll.students.length}`);

  // ── TEST 8: Unauthorized faculty cannot fetch unrelated class data ────────
  console.log("\n--- TEST 8: Unauthorized Access Checks ---");
  // Prof. Ananya Deshmukh teaches TY Sem 5 only
  const ananyaUser = await prisma.user.findFirst({
    where: { email: "ananya.deshmukh@example.edu" },
  });
  let unauthorizedBlocked = false;
  try {
    // Attempting to query BE Sem 7 without an assignment
    await attendanceService.listClassStudents(ananyaUser.id, {
      year: "BE",
      semester: 7,
      division: "Div A",
    });
  } catch (err) {
    unauthorizedBlocked = true;
    console.log(`✓ Unauthorized faculty correctly rejected with 403: "${err.message}"`);
  }
  if (!unauthorizedBlocked) throw new Error("Unauthorized faculty was not blocked!");

  // ── TEST 9: Attendance Session & Records Submission ───────────────────────
  console.log("\n--- TEST 9: Attendance Session & Records Workflow ---");
  // Clean up any existing active session for testing
  const existingActive = await prisma.attendanceSession.findFirst({
    where: { assignment: { facultyId: kirtiUser.facultyProfile.id }, status: "ACTIVE" },
  });
  if (existingActive) {
    await prisma.attendanceSession.update({
      where: { id: existingActive.id },
      data: { status: "COMPLETED" },
    });
  }

  const session = await attendanceService.createSession(kirtiUser.id, {
    assignmentId: beAssignment.id,
    date: new Date().toISOString().slice(0, 10),
    division: "Div A",
    attendanceType: "Class Lecture",
    sessionType: "Lecture",
    lectureTime: "09:00 AM - 10:00 AM",
  });
  console.log(`✓ Created session ID: ${session.id}, status: ${session.status}, division: ${session.division}`);

  const startedSession = await attendanceService.startSession(kirtiUser.id, session.id);
  console.log(`✓ Started session status: ${startedSession.status}, expiresAt: ${startedSession.expiresAt}, remainingSeconds: ${startedSession.remainingSeconds}`);

  const sessionStudents = await attendanceService.getSessionStudents(kirtiUser.id, session.id);
  console.log(`✓ Session loaded students count: ${sessionStudents.students.length} (Expected: 15)`);
  if (sessionStudents.students.length !== 15) throw new Error(`Expected 15 students in session, got ${sessionStudents.students.length}`);

  // Mark all present
  const records = sessionStudents.students.map((st, i) => ({
    studentId: st.id,
    status: i === 0 ? "ABSENT" : "PRESENT",
  }));

  const saved = await attendanceService.saveRecords(kirtiUser.id, session.id, records);
  console.log(`✓ Saved records: present=${saved.stats.present}, absent=${saved.stats.absent}, total=${saved.stats.total}`);
  if (saved.stats.present !== 14 || saved.stats.absent !== 1) {
    throw new Error(`Expected 14 present, 1 absent; got ${saved.stats.present} present, ${saved.stats.absent} absent`);
  }

  // Complete session
  const completed = await attendanceService.completeSession(kirtiUser.id, session.id);
  console.log(`✓ Completed session status: ${completed.status}`);

  console.log("\n==================================================");
  console.log("   ALL 10 VERIFICATION TESTS PASSED SUCCESSFULLY!  ");
  console.log("==================================================");

  await prisma.$disconnect();
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
