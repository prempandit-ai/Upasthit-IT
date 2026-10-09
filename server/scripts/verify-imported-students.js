require("dotenv").config();
const prisma = require("../src/config/prisma");
const { comparePassword } = require("../src/utils/hashPassword");

async function verify() {
  console.log("=== POST-IMPORT DATABASE VERIFICATION ===");

  const students = await prisma.studentProfile.findMany({
    include: { user: true, department: true },
  });

  console.log(`Total StudentProfile records: ${students.length}`);
  const studentUsers = await prisma.user.findMany({
    where: { role: "STUDENT" },
  });
  console.log(`Total User records with role STUDENT: ${studentUsers.length}`);

  const nonBE = students.filter((s) => s.year !== "BE");
  const nonSem7 = students.filter((s) => s.semester !== 7);
  const nonIT = students.filter((s) => s.departmentCode !== "IT");

  console.log(`Non-BE students: ${nonBE.length}`);
  console.log(`Non-Semester 7 students: ${nonSem7.length}`);
  console.log(`Non-IT students: ${nonIT.length}`);

  // Check password bcrypt hashing for all student users
  let allPasswordsHashed = true;
  let matchesPassword123 = 0;
  for (const u of studentUsers) {
    if (!u.password.startsWith("$2b$") && !u.password.startsWith("$2a$")) {
      allPasswordsHashed = false;
    }
    const isMatch = await comparePassword("Password123", u.password);
    if (isMatch) matchesPassword123++;
  }
  console.log(`All student passwords are bcrypt hashes: ${allPasswordsHashed}`);
  console.log(`Students matching Password123 hash: ${matchesPassword123}/${studentUsers.length}`);

  // Confirm pending accounts status
  const pendingCount = studentUsers.filter((u) => u.status === "PENDING").length;
  console.log(`Students with status PENDING: ${pendingCount}/${studentUsers.length}`);

  // Confirm preserved system data
  const facultyCount = await prisma.facultyProfile.count();
  const hodCount = await prisma.hODProfile.count();
  const coordCount = await prisma.coordinatorProfile.count();
  const adminCount = await prisma.adminProfile.count();
  const deptCount = await prisma.department.count();
  const subjectCount = await prisma.subject.count();
  const assignmentCount = await prisma.facultySubjectAssignment.count();

  console.log("\nPreserved records check:");
  console.log(`- FacultyProfiles: ${facultyCount} (Expected: 1)`);
  console.log(`- HODProfiles: ${hodCount} (Expected: 1)`);
  console.log(`- CoordinatorProfiles: ${coordCount} (Expected: 1)`);
  console.log(`- AdminProfiles: ${adminCount} (Expected: 1)`);
  console.log(`- Departments: ${deptCount} (Expected: 4)`);
  console.log(`- Subjects: ${subjectCount} (Expected: 4)`);
  console.log(`- FacultySubjectAssignments: ${assignmentCount} (Expected: 2)`);

  await prisma.$disconnect();
}

verify().catch((e) => {
  console.error("Verification error:", e);
  process.exit(1);
});
