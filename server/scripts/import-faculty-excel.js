require("dotenv").config();
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const prisma = require("../src/config/prisma");
const { hashPassword, comparePassword } = require("../src/utils/hashPassword");

const FACULTY_EXCEL_PATH = path.resolve(__dirname, "../uploads/UPASTHIT_FACULTY_BE_WITH_SAMPLE_DATA.xlsx");
const SUBJECTS_EXCEL_PATH = path.resolve(__dirname, "../uploads/UPASTHIT_SUBJECTS_BE_UPDATED.xlsx");
const BACKUP_DIR = path.resolve(__dirname, "../backups");
const TEMPORARY_PASSWORD = "Faculty123";

const romanToInt = (r) => {
  if (r === null || r === undefined) return null;
  const map = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };
  if (typeof r === "number") return r;
  const s = String(r).trim().toUpperCase();
  return map[s] ?? parseInt(s, 10) ?? null;
};

const mapYear = (yearCell, sem) => {
  if (yearCell) {
    const y = String(yearCell).trim().toLowerCase();
    if (y.includes("4th") || y === "be" || y === "4") return "BE";
    if (y.includes("3rd") || y === "ty" || y === "3") return "TY";
    if (y.includes("2nd") || y === "sy" || y === "2") return "SY";
    if (y.includes("1st") || y === "fy" || y === "1") return "FY";
  }
  if (sem >= 7) return "BE";
  if (sem >= 5) return "TY";
  if (sem >= 3) return "SY";
  return "FY";
};

const mapSubjectType = (st) => {
  if (!st) return "THEORY";
  const s = String(st).trim().toUpperCase();
  if (s.includes("PRAC") || s.includes("LAB")) return "PRACTICAL";
  if (s.includes("ELEC")) return "ELECTIVE";
  if (s.includes("AUD")) return "AUDIT";
  return "THEORY";
};

function verifyBackupIntegrity() {
  console.log("\n[STEP 1/7] Verifying database backup existence and integrity...");
  if (!fs.existsSync(BACKUP_DIR)) {
    throw new Error(`Backup directory ${BACKUP_DIR} does not exist!`);
  }
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith("db-backup-") && f.endsWith(".json"));
  if (files.length === 0) {
    throw new Error("No database backup files found in server/backups!");
  }
  files.sort().reverse();
  const latestBackupPath = path.join(BACKUP_DIR, files[0]);
  const raw = fs.readFileSync(latestBackupPath, "utf8");
  const backup = JSON.parse(raw);
  if (!backup.tables || !Array.isArray(backup.tables.users) || backup.tables.users.length === 0) {
    throw new Error(`Backup file ${files[0]} is malformed or empty!`);
  }
  console.log(`✓ Backup validated: "${files[0]}" contains ${backup.tables.users.length} users, ${backup.tables.subjects.length} subjects.`);
  return latestBackupPath;
}

function parseSubjectsExcel() {
  console.log("\n[STEP 2/7] Parsing subjects workbook (UPASTHIT_SUBJECTS_BE_UPDATED.xlsx)...");
  if (!fs.existsSync(SUBJECTS_EXCEL_PATH)) {
    throw new Error(`Subjects workbook not found at: ${SUBJECTS_EXCEL_PATH}`);
  }
  const wb = XLSX.readFile(SUBJECTS_EXCEL_PATH);
  const subjects = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    if (rawRows.length < 4) continue;
    for (let i = 3; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || !row[0] || String(row[0]).trim() === "" || String(row[0]).toLowerCase().includes("illustrative") || String(row[0]).toLowerCase().includes("subject names updated")) {
        continue;
      }
      const code = String(row[0]).trim();
      const name = row[1] ? String(row[1]).trim() : "";
      const rawType = row[2] ? String(row[2]).trim() : "Theory";
      const deptCode = row[3] ? String(row[3]).trim().toUpperCase() : "IT";
      const academicYear = row[4] ? String(row[4]).trim() : "2025-26";
      const sem = romanToInt(row[5]);
      const year = mapYear(row[6], sem);

      subjects.push({
        sheet: sheetName,
        subjectCode: code,
        subjectName: name,
        subjectType: mapSubjectType(rawType),
        departmentCode: deptCode,
        academicYear,
        semester: sem,
        year,
      });
    }
  }

  console.log(`✓ Total parsed subjects from Excel: ${subjects.length}`);
  return subjects;
}

function parseFacultyExcel() {
  console.log("\n[STEP 3/7] Parsing faculty workbook (UPASTHIT_FACULTY_BE_WITH_SAMPLE_DATA.xlsx)...");
  if (!fs.existsSync(FACULTY_EXCEL_PATH)) {
    throw new Error(`Faculty workbook not found at: ${FACULTY_EXCEL_PATH}`);
  }
  const wb = XLSX.readFile(FACULTY_EXCEL_PATH);
  const facultyMap = new Map();
  const facultyList = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    if (rawRows.length < 4) continue;
    for (let i = 3; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || !row[0] || String(row[0]).trim() === "" || String(row[0]).toLowerCase().includes("fictional") || String(row[0]).toLowerCase().includes("faculty names")) {
        continue;
      }
      const employeeId = String(row[0]).trim();
      const name = row[1] ? String(row[1]).trim() : "";
      const email = row[2] ? String(row[2]).trim().toLowerCase() : "";
      const deptCode = row[3] ? String(row[3]).trim().toUpperCase() : "IT";
      const designation = row[4] ? String(row[4]).trim() : "Assistant Professor";
      const yearRaw = row[5] ? String(row[5]).trim() : "";
      const academicYear = row[6] ? String(row[6]).trim() : "";
      const sem = romanToInt(row[7]);
      const year = mapYear(yearRaw, sem);
      const subjectCode = row[8] ? String(row[8]).trim() : null;
      const subjectName = row[9] ? String(row[9]).trim() : "";

      const key = email || employeeId;
      if (facultyMap.has(key)) {
        const existing = facultyMap.get(key);
        if (subjectCode) {
          existing.assignments.push({
            subjectCode,
            subjectName,
            academicYear,
            year,
            semester: sem,
            sheet: sheetName,
          });
        }
      } else {
        const facultyPerson = {
          employeeId,
          name,
          email,
          deptCode,
          designation,
          assignments: subjectCode ? [{
            subjectCode,
            subjectName,
            academicYear,
            year,
            semester: sem,
            sheet: sheetName,
          }] : [],
        };
        facultyMap.set(key, facultyPerson);
        facultyList.push(facultyPerson);
      }
    }
  }

  console.log(`✓ Total distinct faculty parsed from Excel: ${facultyList.length}`);
  return facultyList;
}

async function executeFacultyReimport() {
  console.log("================================================================================");
  console.log("             UPASTHIT — EXECUTING FACULTY REIMPORT & LOGIN RESET               ");
  console.log("================================================================================");

  // 1. Verify backup
  verifyBackupIntegrity();

  // 2. Parse workbooks
  const excelSubjects = parseSubjectsExcel();
  const excelFaculty = parseFacultyExcel();

  // 3. Pre-flight checks on DB
  console.log("\n[STEP 4/7] Pre-flight database state check...");
  const itDept = await prisma.department.findUnique({ where: { code: "IT" } });
  if (!itDept) {
    throw new Error("Required department 'IT' not found in database!");
  }
  console.log(`✓ IT Department verified: ID ${itDept.id} (${itDept.name})`);

  const existingFaculty = await prisma.user.findMany({
    where: { role: "FACULTY" },
    include: {
      facultyProfile: {
        include: {
          subjectAssignments: {
            include: {
              attendanceSessions: {
                include: { records: true }
              }
            }
          }
        }
      }
    }
  });
  console.log(`✓ Found ${existingFaculty.length} existing FACULTY user accounts in database.`);

  // Verify none of the accounts to delete have historical attendance records
  for (const f of existingFaculty) {
    const prof = f.facultyProfile;
    if (prof) {
      const totalSessions = prof.subjectAssignments.reduce((acc, a) => acc + a.attendanceSessions.length, 0);
      const totalRecords = prof.subjectAssignments.reduce(
        (acc, a) => acc + a.attendanceSessions.reduce((rAcc, s) => rAcc + s.records.length, 0),
        0
      );
      if (totalSessions > 0 || totalRecords > 0) {
        throw new Error(`SAFETY ABORT: Existing faculty ${f.email} has ${totalSessions} attendance sessions and ${totalRecords} records! Cannot delete.`);
      }
    }
  }
  console.log("✓ Safety check passed: 0 attendance sessions or records linked to existing faculty.");

  // Pre-hash temporary password
  console.log(`\n[STEP 5/7] Preparing credentials with bcrypt hash for temporary password "${TEMPORARY_PASSWORD}"...`);
  const hashedPassword = await hashPassword(TEMPORARY_PASSWORD);
  console.log("✓ Bcrypt password hash generated successfully.");

  // 4. Execute atomic transaction
  console.log("\n[STEP 6/7] Executing atomic database transaction...");

  const transactionResult = await prisma.$transaction(async (tx) => {
    // A. Remove existing unmatched test faculty accounts
    console.log("  -> Removing existing unmatched test faculty accounts...");
    for (const f of existingFaculty) {
      if (f.facultyProfile) {
        // Delete subject assignments first
        await tx.facultySubjectAssignment.deleteMany({
          where: { facultyId: f.facultyProfile.id },
        });
        // Delete faculty profile
        await tx.facultyProfile.delete({
          where: { id: f.facultyProfile.id },
        });
      }
      // Delete user
      await tx.user.delete({
        where: { id: f.id },
      });
      console.log(`     ✓ Deleted test faculty: ${f.name} (${f.email})`);
    }

    // B. Upsert Subjects from Excel
    console.log("  -> Upserting curriculum subjects from Excel...");
    const subjectMap = new Map();
    for (const s of excelSubjects) {
      const dept = await tx.department.findUnique({ where: { code: s.departmentCode } });
      const deptId = dept ? dept.id : itDept.id;

      const dbSubject = await tx.subject.upsert({
        where: { subjectCode: s.subjectCode },
        update: {
          subjectName: s.subjectName,
          subjectType: s.subjectType,
          departmentCode: s.departmentCode,
          departmentId: deptId,
          academicYear: s.academicYear,
          semester: s.semester,
          year: s.year,
        },
        create: {
          subjectCode: s.subjectCode,
          subjectName: s.subjectName,
          subjectType: s.subjectType,
          departmentCode: s.departmentCode,
          departmentId: deptId,
          academicYear: s.academicYear,
          semester: s.semester,
          year: s.year,
        },
      });
      subjectMap.set(s.subjectCode, dbSubject);
      console.log(`     ✓ Subject: [${dbSubject.subjectCode}] ${dbSubject.subjectName} (${dbSubject.year}, Sem ${dbSubject.semester})`);
    }

    // C. Provision Faculty Accounts, Profiles, and Subject Assignments
    console.log("  -> Provisioning Faculty accounts and profiles...");
    const provisionedFaculty = [];

    for (const ef of excelFaculty) {
      const dept = await tx.department.findUnique({ where: { code: ef.deptCode } });
      const deptId = dept ? dept.id : itDept.id;
      const deptName = dept ? dept.name : "Information Technology";

      // Create User
      const user = await tx.user.create({
        data: {
          name: ef.name,
          email: ef.email,
          password: hashedPassword,
          role: "FACULTY",
          status: "APPROVED",
          isActive: true,
          mustChangePassword: true,
          tokenVersion: 1,
        },
      });

      // Create FacultyProfile
      const profile = await tx.facultyProfile.create({
        data: {
          userId: user.id,
          employeeId: ef.employeeId,
          designation: ef.designation,
          departmentId: deptId,
          departmentName: deptName,
        },
      });

      // Create Subject Assignments
      const createdAssignments = [];
      for (const a of ef.assignments) {
        const sub = subjectMap.get(a.subjectCode);
        if (!sub) {
          throw new Error(`Cannot assign subject ${a.subjectCode}: not found in subject map!`);
        }
        const assignment = await tx.facultySubjectAssignment.create({
          data: {
            facultyId: profile.id,
            subjectId: sub.id,
            academicYear: a.academicYear,
            division: null, // all divisions
          },
        });
        createdAssignments.push({
          assignmentId: assignment.id,
          subjectCode: sub.subjectCode,
          subjectName: sub.subjectName,
        });
      }

      console.log(`     ✓ Provisioned [${ef.employeeId}] ${ef.name} (${ef.email}) with ${createdAssignments.length} subject assignment(s)`);
      provisionedFaculty.push({
        userId: user.id,
        employeeId: ef.employeeId,
        name: ef.name,
        email: ef.email,
        profileId: profile.id,
        assignments: createdAssignments,
      });
    }

    return {
      deletedOldCount: existingFaculty.length,
      provisionedCount: provisionedFaculty.length,
      subjectsCount: subjectMap.size,
      provisionedFaculty,
    };
  });

  console.log("\n✓ Transaction committed successfully!");
  console.log(`  - Old Faculty deleted: ${transactionResult.deletedOldCount}`);
  console.log(`  - Subjects upserted:  ${transactionResult.subjectsCount}`);
  console.log(`  - Faculty provisioned: ${transactionResult.provisionedCount}`);

  // 5. Post-Import Verification
  console.log("\n[STEP 7/7] Post-import database verification and integrity testing...");

  const [
    allUsersCount,
    facultyUsers,
    facultyProfiles,
    subjectsCount,
    assignmentsCount,
    studentUsersCount,
    hodUsersCount,
    coordUsersCount,
    adminUsersCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
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
    }),
    prisma.facultyProfile.count(),
    prisma.subject.count(),
    prisma.facultySubjectAssignment.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "HOD" } }),
    prisma.user.count({ where: { role: "COORDINATOR" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  console.log("--------------------------------------------------------------------------------");
  console.log("                           POST-IMPORT VERIFICATION                            ");
  console.log("--------------------------------------------------------------------------------");
  console.log(`Total Users in DB:             ${allUsersCount}`);
  console.log(`- FACULTY Users:               ${facultyUsers.length} (Expected: 10)`);
  console.log(`- STUDENT Users (Preserved):   ${studentUsersCount} (Expected: 30)`);
  console.log(`- HOD Users (Preserved):       ${hodUsersCount} (Expected: 1)`);
  console.log(`- COORDINATOR Users (Preserved):${coordUsersCount} (Expected: 2)`);
  console.log(`- ADMIN Users (Preserved):     ${adminUsersCount} (Expected: 1)`);
  console.log(`Faculty Profiles in DB:        ${facultyProfiles} (Expected: 10)`);
  console.log(`Subjects in DB:                ${subjectsCount} (Expected: 14)`);
  console.log(`Faculty Subject Assignments:   ${assignmentsCount} (Expected: 10)`);

  // Verify each faculty login credentials with bcrypt
  console.log("\nTesting login authentication & mustChangePassword flags for all 10 faculty:");
  for (const fu of facultyUsers) {
    const isPasswordValid = await comparePassword(TEMPORARY_PASSWORD, fu.password);
    if (!isPasswordValid) {
      throw new Error(`Authentication check FAILED for ${fu.email}!`);
    }
    if (fu.mustChangePassword !== true) {
      throw new Error(`mustChangePassword flag check FAILED for ${fu.email}!`);
    }
    const prof = fu.facultyProfile;
    if (!prof) {
      throw new Error(`Missing FacultyProfile for ${fu.email}!`);
    }
    const assignments = prof.subjectAssignments.map(a => `${a.subject.subjectCode} (${a.subject.subjectName})`).join(", ");
    console.log(`  ✓ [${prof.employeeId}] ${fu.name} <${fu.email}>: Password OK, mustChangePassword=true, Subject: [${assignments}]`);
  }

  console.log("\n================================================================================");
  console.log("                    FACULTY REIMPORT COMPLETED SUCCESSFULLY!                    ");
  console.log("================================================================================\n");

  await prisma.$disconnect();
}

executeFacultyReimport().catch((e) => {
  console.error("Execution error:", e);
  process.exit(1);
});
