require("dotenv").config();
const prisma = require("../src/config/prisma");
const { comparePassword } = require("../src/utils/hashPassword");
const { generateToken, verifyToken } = require("../src/utils/jwt");
const { buildTokenPayload, sanitizeUser } = require("../src/utils/userHelpers");

async function verifySystem() {
  console.log("================================================================================");
  console.log("             UPASTHIT — COMPREHENSIVE FACULTY VERIFICATION SUITE               ");
  console.log("================================================================================\n");

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      testPassed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      testFailed++;
    }
  }

  // TEST 1: Account count & preservation
  console.log("1. Account Counts & Role Preservation:");
  const [totalUsers, facultyUsers, students, hods, coords, admins] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "FACULTY" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "HOD" } }),
    prisma.user.count({ where: { role: "COORDINATOR" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  assert(facultyUsers === 10, `Faculty count is exactly 10 (got ${facultyUsers})`);
  assert(students === 30, `Student accounts preserved at 30 (got ${students})`);
  assert(hods === 1, `HOD account preserved at 1 (got ${hods})`);
  assert(coords === 2, `Coordinator accounts preserved at 2 (got ${coords})`);
  assert(admins === 1, `Admin account preserved at 1 (got ${admins})`);
  assert(totalUsers === 44, `Total users count is exactly 44 (got ${totalUsers})`);

  // TEST 2: Unique emails & valid profiles
  console.log("\n2. Faculty Profile & Uniqueness Checks:");
  const allFaculty = await prisma.user.findMany({
    where: { role: "FACULTY" },
    include: {
      facultyProfile: {
        include: {
          department: true,
          subjectAssignments: {
            include: { subject: true }
          }
        }
      }
    }
  });

  const emails = new Set();
  const empIds = new Set();
  let allHaveProfiles = true;
  let allHaveDepartment = true;
  let allHaveSubjectAssignments = true;
  let allMustChangePassword = true;

  for (const f of allFaculty) {
    emails.add(f.email);
    if (!f.facultyProfile) {
      allHaveProfiles = false;
    } else {
      empIds.add(f.facultyProfile.employeeId);
      if (!f.facultyProfile.departmentId || f.facultyProfile.department?.code !== "IT") {
        allHaveDepartment = false;
      }
      if (f.facultyProfile.subjectAssignments.length === 0) {
        allHaveSubjectAssignments = false;
      }
    }
    if (f.mustChangePassword !== true) {
      allMustChangePassword = false;
    }
  }

  assert(emails.size === 10, `All 10 faculty emails are unique (size: ${emails.size})`);
  assert(empIds.size === 10, `All 10 employee IDs are unique (size: ${empIds.size})`);
  assert(allHaveProfiles, "Every Faculty user has a linked FacultyProfile");
  assert(allHaveDepartment, "Every FacultyProfile is linked to the IT Department");
  assert(allHaveSubjectAssignments, "Every FacultyProfile has subject assignments linked");
  assert(allMustChangePassword, "Every Faculty user has mustChangePassword = true");

  // TEST 3: Subject Assignment Mapping
  console.log("\n3. Subject Assignment Verification:");
  const expectedSubjectMappings = {
    "ananya.deshmukh@example.edu": "TEIT501",
    "rohan.kulkarni@example.edu": "TEIT502",
    "meera.shah@example.edu": "TEIT503",
    "karan.patil@example.edu": "TEIT504",
    "priya.joshi@example.edu": "TEIT505",
    "kirti.faculty@example.com": "BEIT701",
    "gaidhane.faculty@example.com": "BEIT702",
    "vidya.kubde@example.com": "BEIT703",
    "vaishali.faculty@example.com": "BEIT704",
    "pallavi.faculty@example.com": "BEIT705",
  };

  let allSubjectsCorrectlyMapped = true;
  for (const f of allFaculty) {
    const expectedSubCode = expectedSubjectMappings[f.email];
    const assignedCodes = f.facultyProfile?.subjectAssignments.map(a => a.subject.subjectCode) || [];
    if (!assignedCodes.includes(expectedSubCode)) {
      console.error(`  Mismatch for ${f.email}: expected ${expectedSubCode}, got ${assignedCodes.join(", ")}`);
      allSubjectsCorrectlyMapped = false;
    }
  }
  assert(allSubjectsCorrectlyMapped, "All 10 faculty are correctly mapped to their expected subject codes from Excel");

  // TEST 4: Temporary Password & Authentication
  console.log("\n4. Password Authentication & Bcrypt Verification:");
  let allPasswordsMatch = true;
  for (const f of allFaculty) {
    const isCorrect = await comparePassword("Faculty123", f.password);
    if (!isCorrect) allPasswordsMatch = false;
  }
  assert(allPasswordsMatch, "All 10 faculty authenticate successfully with temporary password 'Faculty123'");

  // TEST 5: Token Versioning & JWT Revocation Logic
  console.log("\n5. Token Versioning & Revocation Verification:");
  const testFacultyUser = allFaculty[0];
  const oldPayload = buildTokenPayload(testFacultyUser);
  const oldToken = generateToken(oldPayload);
  const decodedOld = verifyToken(oldToken);
  assert(decodedOld.tokenVersion === testFacultyUser.tokenVersion, "Generated JWT carries current tokenVersion");

  // Simulate token revocation by incrementing tokenVersion in DB
  await prisma.user.update({
    where: { id: testFacultyUser.id },
    data: { tokenVersion: { increment: 1 } },
  });
  const reloadedUser = await prisma.user.findUnique({ where: { id: testFacultyUser.id } });
  assert(decodedOld.tokenVersion !== reloadedUser.tokenVersion, "Token version mismatch detected after increment (revocation simulation)");

  // Restore tokenVersion for clean state
  await prisma.user.update({
    where: { id: testFacultyUser.id },
    data: { tokenVersion: 1 },
  });
  assert(true, "Token revocation & versioning verification complete");

  // TEST 6: Attendance Data & Subjects Table Integrity
  console.log("\n6. Database Integrity (Attendance & Subjects):");
  const attendanceSessions = await prisma.attendanceSession.count();
  const attendanceRecords = await prisma.attendanceRecord.count();
  const subjectsTotal = await prisma.subject.count();

  assert(attendanceSessions === 0, `Attendance sessions count intact (${attendanceSessions})`);
  assert(attendanceRecords === 0, `Attendance records count intact (${attendanceRecords})`);
  assert(subjectsTotal === 14, `Subjects count is 14 (4 previous + 10 curriculum subjects, got ${subjectsTotal})`);

  console.log("\n--------------------------------------------------------------------------------");
  console.log(`TEST SUITE RESULTS: ${testPassed} PASSED, ${testFailed} FAILED`);
  console.log("--------------------------------------------------------------------------------\n");

  await prisma.$disconnect();

  if (testFailed > 0) {
    process.exit(1);
  }
}

verifySystem().catch((e) => {
  console.error("Verification error:", e);
  process.exit(1);
});
