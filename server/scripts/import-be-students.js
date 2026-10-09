require("dotenv").config();
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const prisma = require("../src/config/prisma");
const { hashPassword, comparePassword } = require("../src/utils/hashPassword");

const EXCEL_PATH = path.resolve(__dirname, "../uploads/UPASTHIT_DEMO_DATA.xlsx");
const BACKUP_PATH = path.resolve(__dirname, "../backups/db-backup-2026-10-09T02-09-38-986Z.json");
const TARGET_ORPHAN_ID = "cmuyf854e0001scug2n3uw97z";
const TARGET_ORPHAN_EMAIL = "panaik16@gmail.com";

function verifyBackupIntegrity() {
  console.log("\n[CHECK 1/6] Verifying database backup integrity...");
  if (!fs.existsSync(BACKUP_PATH)) {
    throw new Error(`Backup file not found at: ${BACKUP_PATH}`);
  }
  const raw = fs.readFileSync(BACKUP_PATH, "utf8");
  const backup = JSON.parse(raw);
  if (!backup.tables || !Array.isArray(backup.tables.users) || backup.tables.users.length === 0) {
    throw new Error("Backup JSON is missing required tables or is empty!");
  }
  console.log(`✓ Backup validated: Contains ${backup.tables.users.length} users, ${backup.tables.departments.length} departments.`);
  return backup;
}

function parseBEStudents() {
  console.log("\n[CHECK 2/6] Parsing and validating BE worksheet from Excel...");
  const wb = XLSX.readFile(EXCEL_PATH);
  const rawData = XLSX.utils.sheet_to_json(wb.Sheets["BE"], { header: 1 });
  const headers = rawData[1].map((h) => (h ? String(h).trim() : ""));

  const students = [];
  for (let i = 2; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0 || row.every((c) => c === undefined || c === null || String(c).trim() === "")) continue;
    if (row.length === 1 || (row[0] && String(row[0]).includes("BE - DIV"))) continue;
    if (row[0] === "Roll No." || row[1] === "Student ID / GR No.") continue;

    const d = {};
    headers.forEach((h, idx) => {
      if (h) d[h] = row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : "";
    });

    let div = d["Division"] || "";
    if (div.toLowerCase().startsWith("div ")) {
      div = div.replace(/div\s+/i, "").trim();
    }

    students.push({
      rollNo: parseInt(d["Roll No."], 10),
      studentId: d["Student ID / GR No."],
      name: d["Name of Student"],
      mobileNumber: d["Mobile Number"] || null,
      email: (d["Email ID"] || "").toLowerCase(),
      deptCode: d["Department Code"] || "IT",
      deptName: d["Department Name"] || "Information Technology",
      academicYear: d["Academic Year"],
      semester: 7,
      division: div,
      year: "BE",
      enrollmentStatus: "ACTIVE",
    });
  }

  const divA = students.filter((s) => s.division === "A");
  const divB = students.filter((s) => s.division === "B");
  console.log(`✓ Total parsed BE students: ${students.length} (Div A: ${divA.length}, Div B: ${divB.length})`);
  if (students.length !== 30 || divA.length !== 15 || divB.length !== 15) {
    throw new Error(`Expected exactly 30 BE students (15 Div A, 15 Div B), got ${students.length}`);
  }
  return students;
}

async function verifyTargetDatabaseAndDependencies() {
  console.log("\n[CHECK 3/6] Pre-execution database and account verification...");

  // Verify IT Department
  const itDept = await prisma.department.findFirst({ where: { code: "IT" } });
  if (!itDept) throw new Error("IT Department not found in database!");
  console.log(`✓ Target Department: ID ${itDept.id} (${itDept.code} - ${itDept.name})`);

  // Verify orphaned coordinator user
  const orphanUser = await prisma.user.findUnique({
    where: { id: TARGET_ORPHAN_ID },
    include: {
      coordinatorProfile: true,
      facultyProfile: true,
      hodProfile: true,
      adminProfile: true,
      studentProfile: true,
      approvalsMade: true,
      approvalsReceived: true,
    },
  });

  if (!orphanUser) {
    console.log(`Notice: Orphan coordinator ${TARGET_ORPHAN_ID} not found (already deleted or absent).`);
  } else {
    if (orphanUser.email !== TARGET_ORPHAN_EMAIL) {
      throw new Error(`Account ID mismatch: Email is ${orphanUser.email}, expected ${TARGET_ORPHAN_EMAIL}`);
    }
    if (orphanUser.role !== "COORDINATOR") {
      throw new Error(`Account ID mismatch: Role is ${orphanUser.role}, expected COORDINATOR`);
    }
    if (orphanUser.coordinatorProfile !== null) {
      throw new Error("Safety check failed: Orphan user has an active CoordinatorProfile!");
    }
    if (orphanUser.approvalsMade.length > 0 || orphanUser.approvalsReceived.length > 0) {
      throw new Error("Safety check failed: Orphan user has ApprovalLog references!");
    }
    console.log(`✓ Target orphan coordinator verified: ID ${orphanUser.id}, email: ${orphanUser.email}, role: ${orphanUser.role}, 0 profile/log dependencies.`);
  }

  // Pre-fetch existing students to delete
  const existingStudentUsers = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: { studentProfile: true },
  });
  const studentUserIds = existingStudentUsers.map((u) => u.id);
  const studentProfileIds = existingStudentUsers.map((u) => u.studentProfile?.id).filter(Boolean);

  console.log(`✓ Existing students to delete: ${studentUserIds.length} users, ${studentProfileIds.length} profiles.`);

  return { itDept, orphanUser, studentUserIds, studentProfileIds };
}

async function executeReplacement({ dryRun = true } = {}) {
  verifyBackupIntegrity();
  const students = parseBEStudents();
  const { itDept, orphanUser, studentUserIds, studentProfileIds } = await verifyTargetDatabaseAndDependencies();

  if (dryRun) {
    console.log("\n[DRY RUN COMPLETE] Validation succeeded. To execute, pass --live");
    return;
  }

  console.log("\n[CHECK 4/6] Executing database replacement in a single Prisma transaction...");
  const hashedPassword = await hashPassword("Password123");

  const startTime = Date.now();
  const stats = await prisma.$transaction(async (tx) => {
    let deletedAttendance = 0;
    let deletedEnrollments = 0;
    let deletedLogs = 0;
    let deletedProfiles = 0;
    let deletedStudentUsers = 0;
    let deletedOrphanCoord = 0;

    // 1. Delete dependent attendance records
    if (studentProfileIds.length > 0) {
      const res = await tx.attendanceRecord.deleteMany({
        where: { studentId: { in: studentProfileIds } },
      });
      deletedAttendance = res.count;
    }

    // 2. Delete student subject enrollments
    if (studentProfileIds.length > 0) {
      const res = await tx.studentSubjectEnrollment.deleteMany({
        where: { studentId: { in: studentProfileIds } },
      });
      deletedEnrollments = res.count;
    }

    // 3. Delete approval logs involving students
    if (studentUserIds.length > 0) {
      const res = await tx.approvalLog.deleteMany({
        where: {
          OR: [
            { targetId: { in: studentUserIds } },
            { reviewerId: { in: studentUserIds } },
          ],
        },
      });
      deletedLogs = res.count;
    }

    // 4. Delete StudentProfiles
    if (studentProfileIds.length > 0) {
      const res = await tx.studentProfile.deleteMany({
        where: { id: { in: studentProfileIds } },
      });
      deletedProfiles = res.count;
    }

    // 5. Delete Student Users
    if (studentUserIds.length > 0) {
      const res = await tx.user.deleteMany({
        where: { id: { in: studentUserIds } },
      });
      deletedStudentUsers = res.count;
    }

    // 6. Delete approved orphan coordinator
    if (orphanUser) {
      await tx.user.delete({ where: { id: TARGET_ORPHAN_ID } });
      deletedOrphanCoord = 1;
    }

    // 7. Import 30 BE students
    const createdUsers = [];
    for (const s of students) {
      const createdUser = await tx.user.create({
        data: {
          name: s.name,
          email: s.email,
          password: hashedPassword,
          role: "STUDENT",
          status: "PENDING",
          isActive: true,
        },
      });

      const profile = await tx.studentProfile.create({
        data: {
          userId: createdUser.id,
          studentId: s.studentId,
          rollNo: s.rollNo,
          mobileNumber: s.mobileNumber,
          departmentId: itDept.id,
          departmentCode: s.deptCode,
          departmentName: s.deptName,
          academicYear: s.academicYear,
          semester: s.semester,
          division: s.division,
          year: s.year,
          enrollmentStatus: s.enrollmentStatus,
        },
      });

      createdUsers.push({ ...createdUser, studentProfile: profile });
    }

    return {
      deletedAttendance,
      deletedEnrollments,
      deletedLogs,
      deletedProfiles,
      deletedStudentUsers,
      deletedOrphanCoord,
      importedStudents: createdUsers.length,
    };
  });

  const duration = Date.now() - startTime;
  console.log(`\n✓ Transaction committed successfully in ${duration}ms!`);
  console.log("Stats:", stats);

  // [CHECK 5/6] Post-Import Verification
  console.log("\n[CHECK 5/6] Running Post-Import Database Verification...");
  await runPostImportVerification();
}

async function runPostImportVerification() {
  const students = await prisma.studentProfile.findMany({
    include: { user: true, department: true },
    orderBy: [{ division: "asc" }, { rollNo: "asc" }],
  });

  const studentUsers = await prisma.user.findMany({
    where: { role: "STUDENT" },
  });

  console.log(`1. Total StudentProfile records: ${students.length} (Expected: 30)`);
  console.log(`2. Total STUDENT User records: ${studentUsers.length} (Expected: 30)`);

  if (students.length !== 30 || studentUsers.length !== 30) {
    throw new Error(`Verification failed: Counts do not match 30!`);
  }

  const divA = students.filter((s) => s.division === "A");
  const divB = students.filter((s) => s.division === "B");
  console.log(`3. Division Distribution: Div A = ${divA.length}, Div B = ${divB.length}`);

  const nonBE = students.filter((s) => s.year !== "BE");
  const nonSem7 = students.filter((s) => s.semester !== 7);
  const nonIT = students.filter((s) => s.departmentCode !== "IT");
  const nonPending = studentUsers.filter((u) => u.status !== "PENDING");

  console.log(`4. Year check: ${nonBE.length} non-BE records.`);
  console.log(`5. Semester check: ${nonSem7.length} non-Sem 7 records.`);
  console.log(`6. Department check: ${nonIT.length} non-IT records.`);
  console.log(`7. Status check: ${nonPending.length} non-PENDING accounts.`);

  if (nonBE.length > 0 || nonSem7.length > 0 || nonIT.length > 0 || nonPending.length > 0) {
    throw new Error("Verification failed on student profile field attributes!");
  }

  // Password verification
  let allPasswordsMatch = true;
  for (const u of studentUsers) {
    const isMatch = await comparePassword("Password123", u.password);
    if (!isMatch) {
      allPasswordsMatch = false;
      break;
    }
  }
  console.log(`8. Password check: All passwords match bcrypt hash of Password123: ${allPasswordsMatch}`);
  if (!allPasswordsMatch) {
    throw new Error("Password verification failed!");
  }

  // Check preserved non-student entities
  const [facultyUsers, hodUsers, coordUsers, adminUsers] = await Promise.all([
    prisma.user.count({ where: { role: "FACULTY" } }),
    prisma.user.count({ where: { role: "HOD" } }),
    prisma.user.count({ where: { role: "COORDINATOR" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  const [facultyProfiles, hodProfiles, coordProfiles, adminProfiles, departments, subjects, assignments] = await Promise.all([
    prisma.facultyProfile.count(),
    prisma.hODProfile.count(),
    prisma.coordinatorProfile.count(),
    prisma.adminProfile.count(),
    prisma.department.count(),
    prisma.subject.count(),
    prisma.facultySubjectAssignment.count(),
  ]);

  console.log("\n[CHECK 6/6] Preserved System Records Summary:");
  console.log(`- Faculty Users: ${facultyUsers} | Profiles: ${facultyProfiles}`);
  console.log(`- HOD Users: ${hodUsers} | Profiles: ${hodProfiles}`);
  console.log(`- Coordinator Users: ${coordUsers} | Profiles: ${coordProfiles} (Official IT Coordinator intact)`);
  console.log(`- Admin Users: ${adminUsers} | Profiles: ${adminProfiles}`);
  console.log(`- Departments: ${departments} (All intact)`);
  console.log(`- Subjects: ${subjects} (All intact)`);
  console.log(`- FacultySubjectAssignments: ${assignments} (All intact)`);

  // Verify student Parag Naik exists with panaik16@gmail.com
  const paragNaik = await prisma.user.findUnique({
    where: { email: TARGET_ORPHAN_EMAIL },
    include: { studentProfile: true },
  });
  console.log(`\nVerified Parag Naik Student Record:`);
  console.log(`- ID: ${paragNaik?.id}`);
  console.log(`- Name: ${paragNaik?.name}`);
  console.log(`- Email: ${paragNaik?.email}`);
  console.log(`- Role: ${paragNaik?.role}`);
  console.log(`- Student ID: ${paragNaik?.studentProfile?.studentId}`);
  console.log(`- Division: ${paragNaik?.studentProfile?.division}, Roll: ${paragNaik?.studentProfile?.rollNo}`);
  console.log(`- Year: ${paragNaik?.studentProfile?.year}, Semester: ${paragNaik?.studentProfile?.semester}`);
}

const isLive = process.argv.includes("--live");
executeReplacement({ dryRun: !isLive })
  .catch((e) => {
    console.error("\n❌ Execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
