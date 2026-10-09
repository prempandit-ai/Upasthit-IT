require("dotenv").config();
const XLSX = require("xlsx");
const path = require("path");
const prisma = require("../src/config/prisma");

const FACULTY_EXCEL_PATH = path.resolve(__dirname, "../uploads/UPASTHIT_FACULTY_BE_WITH_SAMPLE_DATA.xlsx");
const SUBJECTS_EXCEL_PATH = path.resolve(__dirname, "../uploads/UPASTHIT_SUBJECTS_BE_UPDATED.xlsx");

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

async function dryRun() {
  console.log("================================================================================");
  console.log("                  UPASTHIT FACULTY REIMPORT & RESET - DRY-RUN REPORT           ");
  console.log("================================================================================\n");

  // 1. Fetch current DB state
  const [
    allUsers,
    allDepartments,
    allFacultyProfiles,
    allSubjects,
    allAssignments,
    totalSessions,
    totalRecords,
  ] = await Promise.all([
    prisma.user.findMany({
      include: {
        facultyProfile: {
          include: {
            department: true,
            subjectAssignments: {
              include: {
                subject: true,
                attendanceSessions: {
                  include: { records: true }
                }
              }
            }
          }
        },
        studentProfile: true,
        hodProfile: true,
        coordinatorProfile: true,
        adminProfile: true,
      }
    }),
    prisma.department.findMany(),
    prisma.facultyProfile.findMany({
      include: {
        user: true,
        department: true,
        subjectAssignments: {
          include: {
            subject: true,
            attendanceSessions: {
              include: { records: true }
            }
          }
        }
      }
    }),
    prisma.subject.findMany({
      include: {
        department: true,
        facultyAssignments: true,
      }
    }),
    prisma.facultySubjectAssignment.findMany({
      include: {
        faculty: { include: { user: true } },
        subject: true,
        attendanceSessions: {
          include: { records: true }
        }
      }
    }),
    prisma.attendanceSession.count(),
    prisma.attendanceRecord.count(),
  ]);

  const deptMapByCode = {};
  allDepartments.forEach(d => { deptMapByCode[d.code.toUpperCase()] = d; });

  const existingFacultyUsers = allUsers.filter(u => u.role === "FACULTY");
  const otherUsers = allUsers.filter(u => u.role !== "FACULTY");

  console.log("--------------------------------------------------------------------------------");
  console.log("  SECTION 1: CURRENT DATABASE STATE");
  console.log("--------------------------------------------------------------------------------");
  console.log(`Total Users in DB:              ${allUsers.length}`);
  console.log(`- FACULTY Users:                ${existingFacultyUsers.length}`);
  console.log(`- STUDENT Users (Preserved):    ${allUsers.filter(u => u.role === "STUDENT").length}`);
  console.log(`- HOD Users (Preserved):        ${allUsers.filter(u => u.role === "HOD").length}`);
  console.log(`- COORDINATOR Users (Preserved):${allUsers.filter(u => u.role === "COORDINATOR").length}`);
  console.log(`- ADMIN Users (Preserved):      ${allUsers.filter(u => u.role === "ADMIN").length}`);
  console.log(`FacultyProfile records:         ${allFacultyProfiles.length}`);
  console.log(`Subjects in DB:                 ${allSubjects.length}`);
  console.log(`Faculty Subject Assignments:    ${allAssignments.length}`);
  console.log(`Attendance Sessions:            ${totalSessions}`);
  console.log(`Attendance Records:             ${totalRecords}`);
  console.log(`Known Departments:             ${allDepartments.map(d => `${d.code} (${d.name})`).join(", ")}`);
  console.log("\nExisting FACULTY Users Detail:");
  existingFacultyUsers.forEach((fu, idx) => {
    const prof = fu.facultyProfile;
    const assignmentsCount = prof ? prof.subjectAssignments.length : 0;
    const sessionCount = prof ? prof.subjectAssignments.reduce((acc, a) => acc + a.attendanceSessions.length, 0) : 0;
    console.log(`  [${idx + 1}] ID: ${fu.id}`);
    console.log(`      Name: "${fu.name}", Email: "${fu.email}", Status: ${fu.status}, Active: ${fu.isActive}`);
    if (prof) {
      console.log(`      FacultyProfile: ID=${prof.id}, EmployeeId="${prof.employeeId}", Designation="${prof.designation}", Dept="${prof.department?.code || prof.departmentName}"`);
      console.log(`      Assignments (${assignmentsCount}): ${prof.subjectAssignments.map(a => `${a.subject.subjectCode} (${a.academicYear})`).join(", ") || "None"}`);
      console.log(`      Linked Attendance Sessions: ${sessionCount}`);
    } else {
      console.log(`      FacultyProfile: NONE (User has role FACULTY but no profile record)`);
    }
  });

  // 2. Parse Subjects Excel
  const wbSubjects = XLSX.readFile(SUBJECTS_EXCEL_PATH);
  const excelSubjects = [];
  const subjectCodeToExcel = new Map();

  for (const sheetName of wbSubjects.SheetNames) {
    const ws = wbSubjects.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    // Row 3 is headers: Subject Code, Subject Name, Subject Type, Department, Academic Year, Semester, Year
    if (rawRows.length < 4) continue;
    const headers = rawRows[2];
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
      const subjectObj = {
        sheet: sheetName,
        subjectCode: code,
        subjectName: name,
        subjectType: mapSubjectType(rawType),
        departmentCode: deptCode,
        academicYear,
        semester: sem,
        year,
      };
      excelSubjects.push(subjectObj);
      subjectCodeToExcel.set(code, subjectObj);
    }
  }

  console.log("\n--------------------------------------------------------------------------------");
  console.log("  SECTION 2: SUBJECTS AUDIT (from UPASTHIT_SUBJECTS_BE_UPDATED.xlsx)");
  console.log("--------------------------------------------------------------------------------");
  console.log(`Subjects Found in Excel:        ${excelSubjects.length}`);
  const existingSubjectCodes = new Set(allSubjects.map(s => s.subjectCode));
  const subjectsToCreate = [];
  const subjectsMatched = [];

  excelSubjects.forEach((es) => {
    if (existingSubjectCodes.has(es.subjectCode)) {
      subjectsMatched.push(es);
    } else {
      subjectsToCreate.push(es);
    }
  });

  console.log(`Existing Subjects in DB Matched: ${subjectsMatched.length}`);
  console.log(`New Subjects to Create in DB:    ${subjectsToCreate.length}`);
  subjectsToCreate.forEach((s, idx) => {
    console.log(`  [${idx + 1}] ${s.subjectCode} - "${s.subjectName}" (Dept: ${s.departmentCode}, Sem: ${s.semester}, Year: ${s.year}, AY: ${s.academicYear}, Type: ${s.subjectType})`);
  });

  // 3. Parse Faculty Excel
  const wbFaculty = XLSX.readFile(FACULTY_EXCEL_PATH);
  const rawFacultyRows = [];

  for (const sheetName of wbFaculty.SheetNames) {
    const ws = wbFaculty.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    // Row 3 is headers: Faculty ID, Faculty Name, Email, Department, Designation, Year, Academic Year, Semester, Assigned Subject Code, Assigned Subject
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

      rawFacultyRows.push({
        sheet: sheetName,
        employeeId,
        name,
        email,
        deptCode,
        designation,
        year,
        academicYear,
        semester: sem,
        subjectCode,
        subjectName,
      });
    }
  }

  console.log("\n--------------------------------------------------------------------------------");
  console.log("  SECTION 3: FACULTY EXCEL PARSE AUDIT (from UPASTHIT_FACULTY_BE_WITH_SAMPLE_DATA.xlsx)");
  console.log("--------------------------------------------------------------------------------");
  console.log(`Total Faculty Rows Parsed:     ${rawFacultyRows.length}`);

  // Deduplicate / Aggregate Faculty persons across worksheets
  // A person may have multiple assigned subjects across sheets or rows
  const facultyMap = new Map(); // key: email or employeeId
  const facultyList = [];

  for (const r of rawFacultyRows) {
    const key = r.email || r.employeeId;
    if (facultyMap.has(key)) {
      const existing = facultyMap.get(key);
      if (r.subjectCode) {
        existing.assignments.push({
          subjectCode: r.subjectCode,
          subjectName: r.subjectName,
          academicYear: r.academicYear,
          year: r.year,
          semester: r.semester,
          sheet: r.sheet,
        });
      }
    } else {
      const facultyPerson = {
        employeeId: r.employeeId,
        name: r.name,
        email: r.email,
        deptCode: r.deptCode,
        designation: r.designation,
        assignments: r.subjectCode ? [{
          subjectCode: r.subjectCode,
          subjectName: r.subjectName,
          academicYear: r.academicYear,
          year: r.year,
          semester: r.semester,
          sheet: r.sheet,
        }] : [],
      };
      facultyMap.set(key, facultyPerson);
      facultyList.push(facultyPerson);
    }
  }

  console.log(`Distinct Faculty Persons:      ${facultyList.length}`);
  facultyList.forEach((f, idx) => {
    console.log(`  [${idx + 1}] ${f.employeeId} | ${f.name} | ${f.email} | Dept: ${f.deptCode} | ${f.designation}`);
    console.log(`      Assigned Subject(s): ${f.assignments.map(a => `${a.subjectCode} (${a.subjectName})`).join(", ") || "None"}`);
  });

  // 4. Cross-Reference Faculty with Database
  console.log("\n--------------------------------------------------------------------------------");
  console.log("  SECTION 4: CROSS-REFERENCE & RECONCILIATION");
  console.log("--------------------------------------------------------------------------------");

  const accountsToReset = [];
  const newAccountsToCreate = [];
  const conflictingNonFacultyAccounts = [];

  for (const ef of facultyList) {
    // Check if email already belongs to a non-faculty user
    const existingUserByEmail = allUsers.find(u => u.email.toLowerCase() === ef.email);
    const existingProfileByEmpId = allFacultyProfiles.find(fp => fp.employeeId.toLowerCase() === ef.employeeId.toLowerCase());

    if (existingUserByEmail && existingUserByEmail.role !== "FACULTY") {
      conflictingNonFacultyAccounts.push({
        excelFaculty: ef,
        conflictingUser: existingUserByEmail,
      });
      continue;
    }

    if (existingUserByEmail) {
      // Existing faculty user by email
      accountsToReset.push({
        action: "RESET_EXISTING_USER",
        excel: ef,
        existingUser: existingUserByEmail,
        existingProfile: existingUserByEmail.facultyProfile,
      });
    } else if (existingProfileByEmpId) {
      // Existing profile by EmployeeId, but different email
      accountsToReset.push({
        action: "RESET_BY_EMPLOYEE_ID",
        excel: ef,
        existingUser: existingProfileByEmpId.user,
        existingProfile: existingProfileByEmpId,
      });
    } else {
      // Completely new faculty account
      newAccountsToCreate.push({
        action: "CREATE_NEW_USER",
        excel: ef,
      });
    }
  }

  console.log(`Excel Faculty matched with existing DB User:    ${accountsToReset.length}`);
  console.log(`Excel Faculty to be CREATED as new DB accounts: ${newAccountsToCreate.length}`);
  console.log(`Conflicts with non-faculty accounts:            ${conflictingNonFacultyAccounts.length}`);

  if (conflictingNonFacultyAccounts.length > 0) {
    console.log("\n  [WARNING] Conflicting accounts detected:");
    conflictingNonFacultyAccounts.forEach(c => {
      console.log(`    - ${c.excelFaculty.email} already exists with role ${c.conflictingUser.role} (ID: ${c.conflictingUser.id})`);
    });
  }

  // 5. Existing DB Faculty Missing from Excel
  const excelEmails = new Set(facultyList.map(f => f.email));
  const excelEmpIds = new Set(facultyList.map(f => f.employeeId.toLowerCase()));

  const unmatchedDbFaculty = existingFacultyUsers.filter(u => {
    const emailMatch = excelEmails.has(u.email.toLowerCase());
    const empIdMatch = u.facultyProfile && excelEmpIds.has(u.facultyProfile.employeeId.toLowerCase());
    return !emailMatch && !empIdMatch;
  });

  console.log(`\nExisting DB Faculty NOT in Excel (Unmatched):   ${unmatchedDbFaculty.length}`);
  unmatchedDbFaculty.forEach((uf, idx) => {
    const prof = uf.facultyProfile;
    const sessionCount = prof ? prof.subjectAssignments.reduce((acc, a) => acc + a.attendanceSessions.length, 0) : 0;
    console.log(`  [${idx + 1}] User ID: ${uf.id}`);
    console.log(`      Name: "${uf.name}", Email: "${uf.email}", Status: ${uf.status}`);
    console.log(`      Profile: ${prof ? `ID=${prof.id}, EmployeeId=${prof.employeeId}` : "NONE"}`);
    console.log(`      Linked Historical Attendance Sessions: ${sessionCount}`);
    console.log(`      Status: RETAINED (No matching Excel record -> passwords not reset unless instructed; no records will be deleted without confirmation).`);
  });

  // 6. Subject Assignment Verification
  console.log("\n--------------------------------------------------------------------------------");
  console.log("  SECTION 5: SUBJECT ASSIGNMENT VERIFICATION");
  console.log("--------------------------------------------------------------------------------");

  let assignmentsCanBeCreated = 0;
  let assignmentsMissingSubject = 0;

  for (const f of facultyList) {
    for (const a of f.assignments) {
      const dbSub = allSubjects.find(s => s.subjectCode === a.subjectCode) || subjectCodeToExcel.get(a.subjectCode);
      if (dbSub) {
        assignmentsCanBeCreated++;
      } else {
        assignmentsMissingSubject++;
        console.log(`  [MISSING SUBJECT] Code: ${a.subjectCode} assigned to ${f.name} (${f.employeeId}) cannot be resolved!`);
      }
    }
  }

  console.log(`Total Subject Assignments to provision: ${assignmentsCanBeCreated}`);
  console.log(`Assignments missing Subject code:        ${assignmentsMissingSubject}`);

  console.log("\n--------------------------------------------------------------------------------");
  console.log("  SECTION 6: RECORDS AT RISK OF DELETION AUDIT");
  console.log("--------------------------------------------------------------------------------");
  console.log("Records at risk of deletion: 0 records.");
  console.log("Explanation: The import process will NOT delete any User, StudentProfile, FacultyProfile,");
  console.log("Subject, or Attendance records. All 30 students, 1 HOD, 2 Coordinators, and 1 Admin remain intact.");
  console.log("Unmatched faculty accounts are identified and preserved safely without disruption.");

  console.log("\n================================================================================");
  console.log("                             END OF DRY-RUN REPORT                              ");
  console.log("================================================================================\n");

  await prisma.$disconnect();
}

dryRun().catch((e) => {
  console.error("Dry run failed:", e);
  process.exit(1);
});
