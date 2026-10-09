require("dotenv").config();
const XLSX = require("xlsx");
const path = require("path");
const prisma = require("../src/config/prisma");

const EXCEL_PATH = path.resolve(__dirname, "../uploads/UPASTHIT_DEMO_DATA.xlsx");

const romanToInt = (r) => {
  const map = { I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8 };
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
const mapEnrollStatus = (s) => {
  if (!s) return "ACTIVE";
  const u = String(s).trim().toUpperCase();
  if (u === "ACTIVE" || u === "DROPPED" || u === "COMPLETED") return u;
  return "ACTIVE";
};

async function main() {
  // ── DATABASE AUDIT ──────────────────────────────────────────────────────
  const [totalUsers, studentUsers, studentProfiles, enrollments, attendanceRecords, approvalLogs, departments] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.studentProfile.count(),
      prisma.studentSubjectEnrollment.count(),
      prisma.attendanceRecord.count(),
      prisma.approvalLog.count({ where: { target: { role: "STUDENT" } } }),
      prisma.department.findMany({ select: { id: true, code: true, name: true } }),
    ]);

  const deptMap = {};
  departments.forEach(d => { deptMap[d.code] = d; });
  const deptCodes = new Set(departments.map(d => d.code));
  const nonStudentUsers = totalUsers - studentUsers;

  console.log("══════════════════════════════════════════════");
  console.log("  DATABASE AUDIT");
  console.log("══════════════════════════════════════════════");
  console.log("Total users:                   ", totalUsers);
  console.log("STUDENT users (to DELETE):     ", studentUsers);
  console.log("Non-student users (PRESERVED): ", nonStudentUsers);
  console.log("StudentProfile records:         ", studentProfiles);
  console.log("StudentSubjectEnrollments:      ", enrollments);
  console.log("AttendanceRecords for students: ", attendanceRecords);
  console.log("ApprovalLogs for students:      ", approvalLogs);
  console.log("Known departments: ", departments.map(d => d.code + "=" + d.name).join(", "));

  // ── EXCEL PARSE (header at row 2) ────────────────────────────────────────
  const wb = XLSX.readFile(EXCEL_PATH);
  console.log("\n══════════════════════════════════════════════");
  console.log("  EXCEL PARSE (header row = row 2)");
  console.log("══════════════════════════════════════════════");

  const valid = [], invalid = [];
  const seenStudentIds = new Set(), seenEmails = new Set();
  let dupStudentIdCount = 0, dupEmailCount = 0;

  for (const sheetName of wb.SheetNames) {
    if (sheetName.toLowerCase().includes("guide") || sheetName.toLowerCase().includes("import")) continue;
    const ws = wb.Sheets[sheetName];
    // Parse with header = 1 (array mode) then slice row 0 (title), use row 1 as headers
    const arr = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    const headers = arr[1]; // row 2 is the actual header
    const dataRows = arr.slice(2); // rows 3+
    console.log(`\nSheet: "${sheetName}" — ${dataRows.length} data rows`);

    for (let i = 0; i < dataRows.length; i++) {
      const rowArr = dataRows[i];
      if (!rowArr || rowArr.every(c => c === null || c === "")) continue; // skip blank rows
      const r = {};
      headers.forEach((h, idx) => { if (h) r[h] = rowArr[idx]; });

      const errors = [], warnings = [];
      const name      = r["Name of Student"] ? String(r["Name of Student"]).trim() : null;
      const email     = r["Email ID"] ? String(r["Email ID"]).trim().toLowerCase() : null;
      const studentId = r["Student ID / GR No."] ? String(r["Student ID / GR No."]).trim() : null;
      const rollNoRaw = r["Roll No."] ?? null;
      const mobile    = r["Mobile Number"] ? String(r["Mobile Number"]).replace(/\D/g, "") : null;
      const deptCode  = r["Department Code"] ? String(r["Department Code"]).trim() : null;
      const deptName  = r["Department Name"] ? String(r["Department Name"]).trim() : null;
      const academicYear = r["Academic Year"] ? String(r["Academic Year"]).trim() : null;
      const semesterRaw  = r["Semester"] ?? null;
      const division     = r["Division"] ? String(r["Division"]).trim() : null;
      const enrollStatus = r["Enrollment Status"] ?? null;
      const yearCell     = r["Year"] ?? null;

      if (!name)       errors.push("Missing: Name of Student");
      if (!email)      errors.push("Missing: Email ID");
      if (!studentId)  errors.push("Missing: Student ID / GR No.");
      if (!deptCode)   errors.push("Missing: Department Code");
      if (!academicYear) errors.push("Missing: Academic Year");

      const semInt = romanToInt(semesterRaw);
      if (!semInt || isNaN(semInt)) errors.push(`Invalid Semester: "${semesterRaw}"`);

      if (deptCode && !deptCodes.has(deptCode))
        errors.push(`Unknown DeptCode: "${deptCode}" (known: ${[...deptCodes].join(",")})`);

      const year = mapYear(yearCell, semInt);

      // Mismatch warning: TE sheet has semester VII → year BE
      if (sheetName === "TE" && semInt === 7) {
        warnings.push(`Sem VII on TE sheet — imported as Year=BE (4th year)`);
      }

      // Duplicates
      const sidKey   = (studentId || "").toUpperCase();
      const emailKey = (email || "").toLowerCase();
      if (sidKey && seenStudentIds.has(sidKey)) { errors.push(`Duplicate Student ID: "${studentId}"`); dupStudentIdCount++; }
      else if (sidKey) seenStudentIds.add(sidKey);
      if (emailKey && seenEmails.has(emailKey)) { errors.push(`Duplicate Email: "${email}"`); dupEmailCount++; }
      else if (emailKey) seenEmails.add(emailKey);

      const rollNo = rollNoRaw !== null && String(rollNoRaw).trim() !== "" ? parseInt(String(rollNoRaw), 10) : null;

      const row = {
        _sheet: sheetName, _row: i + 3, name, email, studentId, rollNo,
        mobileNumber: mobile, departmentCode: deptCode,
        departmentName: deptName || deptMap[deptCode]?.name || deptCode,
        academicYear, semester: semInt, division,
        enrollmentStatus: mapEnrollStatus(enrollStatus),
        year, errors, warnings,
      };

      if (errors.length > 0) invalid.push(row);
      else valid.push(row);
    }
  }

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════");
  console.log("  VALIDATION SUMMARY");
  console.log("══════════════════════════════════════════════");
  console.log("Total rows parsed:             ", valid.length + invalid.length);
  console.log("Valid (ready to import):       ", valid.length);
  console.log("Invalid (will be skipped):     ", invalid.length);
  console.log("Duplicate Student IDs:         ", dupStudentIdCount);
  console.log("Duplicate Emails:              ", dupEmailCount);

  const warnRows = valid.filter(r => r.warnings.length > 0);
  if (warnRows.length > 0) {
    console.log("\nWARNINGS (" + warnRows.length + " rows that will be imported but flagged):");
    warnRows.forEach(r => console.log(`  Row ${r._row} (${r._sheet}) ${r.name}: ${r.warnings.join("; ")}`));
  }

  if (invalid.length > 0) {
    console.log("\nINVALID / SKIPPED ROWS:");
    invalid.forEach(r => console.log(`  Row ${r._row} (${r._sheet}) "${r.name || "N/A"}": ${r.errors.join("; ")}`));
  }

  // Distribution
  const bySheet = {}, bySemester = {}, byYear = {}, byDept = {};
  for (const r of valid) {
    bySheet[r._sheet]  = (bySheet[r._sheet]  || 0) + 1;
    const semKey = `Sem ${r.semester}`;
    bySemester[semKey] = (bySemester[semKey] || 0) + 1;
    byYear[r.year]     = (byYear[r.year]     || 0) + 1;
    byDept[r.departmentCode] = (byDept[r.departmentCode] || 0) + 1;
  }
  console.log("\n── Distribution ─────────────────────────────");
  console.log("By Sheet:     ", JSON.stringify(bySheet));
  console.log("By Semester:  ", JSON.stringify(bySemester));
  console.log("By Year:      ", JSON.stringify(byYear));
  console.log("By Department:", JSON.stringify(byDept));

  console.log("\n══════════════════════════════════════════════");
  console.log("  DRY-RUN DELETION PLAN");
  console.log("══════════════════════════════════════════════");
  console.log("Deletion order (FK-safe, using transactions):");
  console.log("  Step 1: DELETE AttendanceRecord WHERE student IN student_users  →", attendanceRecords, "records");
  console.log("  Step 2: DELETE StudentSubjectEnrollment (via StudentProfile cascade)  →", enrollments, "records");
  console.log("  Step 3: DELETE ApprovalLog WHERE targetId IN student_user_ids   →", approvalLogs, "records");
  console.log("  Step 4: DELETE StudentProfile records                             →", studentProfiles, "records");
  console.log("  Step 5: DELETE User WHERE role=STUDENT                            →", studentUsers, "records");
  console.log("\nIMPORT PLAN:");
  console.log("  Import", valid.length, "students as PENDING Users + StudentProfiles");
  console.log("  Password: random 16-char hex token (bcrypt-hashed, stored in DB)");
  console.log("  Status: PENDING (requires Admin approval, per existing workflow)");
  console.log("\nPRESERVED (will NOT be touched):");
  console.log("  Non-student Users:           ", nonStudentUsers);
  console.log("  Departments:                 ", departments.length);
  console.log("  Subjects, Assignments, etc.  unchanged");

  console.log("\n══════════════════════════════════════════════");
  console.log("  SAMPLE VALID ROWS (first 5)");
  console.log("══════════════════════════════════════════════");
  valid.slice(0, 5).forEach(r => {
    const { errors, warnings, ...clean } = r;
    console.log(JSON.stringify(clean));
  });

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
