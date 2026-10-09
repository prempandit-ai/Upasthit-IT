require("dotenv").config();
const XLSX = require("xlsx");
const path = require("path");
const prisma = require("../src/config/prisma");

const EXCEL_PATH = path.resolve(__dirname, "../uploads/UPASTHIT_DEMO_DATA.xlsx");

async function main() {
  console.log("=== EXCEL FILE INSPECTION ===");
  const wb = XLSX.readFile(EXCEL_PATH);
  console.log("Sheet names in workbook:", wb.SheetNames);

  const beSheet = wb.Sheets["BE"];
  if (!beSheet) {
    console.error("ERROR: Worksheet 'BE' not found!");
    process.exit(1);
  }

  // Convert raw sheet to rows
  const rawData = XLSX.utils.sheet_to_json(beSheet, { header: 1 });
  console.log(`Total raw rows in 'BE' worksheet: ${rawData.length}`);
  console.log("Row 0:", rawData[0]);
  console.log("Row 1 (Headers):", rawData[1]);
  console.log("Row 2 (First record):", rawData[2]);

  // Dump all raw rows to inspect section headers, etc.
  rawData.forEach((r, i) => console.log(`Raw Row ${i}:`, JSON.stringify(r)));

  // The headers are in Row 1 (index 1)
  const headers = rawData[1].map(h => (h ? String(h).trim() : ""));
  console.log("Parsed Headers:", headers);

  const records = [];
  for (let i = 2; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0 || row.every(c => c === undefined || c === null || String(c).trim() === "")) {
      continue;
    }
    // Check if this row is a section header like ['BE - DIV B'] or duplicate header
    if (row.length === 1 || (row[0] && String(row[0]).includes("BE - DIV"))) {
      console.log(`Skipping section header at raw row ${i}:`, row);
      continue;
    }
    if (row[0] === "Roll No." || row[1] === "Student ID / GR No.") {
      console.log(`Skipping repeated column header at raw row ${i}:`, row);
      continue;
    }

    const item = {};
    headers.forEach((h, idx) => {
      if (h) {
        item[h] = row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : "";
      }
    });
    records.push({ rawRowIndex: i, data: item });
  }

  console.log(`\nFiltered potential student records count: ${records.length}`);

  // Validate fields in BE records
  const emails = new Set();
  const studentIds = new Set();
  const duplicateEmails = [];
  const duplicateStudentIds = [];
  const missingRequired = [];
  const validRecords = [];

  for (const rec of records) {
    const d = rec.data;
    const rollNo = d["Roll No."];
    const studentId = d["Student ID / GR No."];
    const name = d["Name of Student"];
    const mobile = d["Mobile Number"];
    const email = d["Email ID"];
    const deptCode = d["Department Code"];
    const deptName = d["Department Name"];
    const academicYear = d["Academic Year"];
    const sem = d["Semester"];
    const div = d["Division"];
    const enrollmentStatus = d["Enrollment Status"];
    const year = d["Year"];

    const missing = [];
    if (!name) missing.push("name");
    if (!email) missing.push("email");
    if (!studentId) missing.push("studentId");
    if (!deptCode && !deptName) missing.push("department");
    if (!academicYear) missing.push("academicYear");

    if (missing.length > 0) {
      missingRequired.push({ row: rec.rawRowIndex + 1, missing, data: d });
    }

    const normEmail = (email || "").toLowerCase();
    if (normEmail) {
      if (emails.has(normEmail)) {
        duplicateEmails.push({ row: rec.rawRowIndex + 1, email: normEmail });
      } else {
        emails.add(normEmail);
      }
    }

    if (studentId) {
      if (studentIds.has(studentId)) {
        duplicateStudentIds.push({ row: rec.rawRowIndex + 1, studentId });
      } else {
        studentIds.add(studentId);
      }
    }

    // Normalize division: "Div A" -> "A", "Div B" -> "B" or keep as is? Let's check how Division is formatted in Prisma
    let cleanDiv = div;
    if (cleanDiv && cleanDiv.toLowerCase().startsWith("div ")) {
      cleanDiv = cleanDiv.replace(/div\s+/i, "").trim();
    }

    validRecords.push({
      excelRowIndex: rec.rawRowIndex + 1,
      rollNo: rollNo ? parseInt(rollNo, 10) : null,
      name,
      studentId,
      email: normEmail,
      mobileNumber: mobile || null,
      departmentCode: deptCode || "IT",
      departmentName: deptName || "Information Technology",
      rawYear: year,
      targetYear: "BE",
      rawSemester: sem,
      targetSemester: 7,
      rawDivision: div,
      division: cleanDiv,
      enrollmentStatus: enrollmentStatus || "ACTIVE",
      academicYear,
    });
  }

  console.log("\n=== EXCEL VALIDATION RESULTS ===");
  console.log(`Total parsed student records: ${validRecords.length}`);
  console.log(`Unique emails: ${emails.size}`);
  console.log(`Duplicate emails:`, duplicateEmails);
  console.log(`Unique student IDs: ${studentIds.size}`);
  console.log(`Duplicate student IDs:`, duplicateStudentIds);
  console.log(`Records with missing required fields:`, missingRequired);

  // Sample records
  console.log("\nSample First 3 Records:");
  console.log(JSON.stringify(validRecords.slice(0, 3), null, 2));
  console.log("\nSample Last Record:");
  console.log(JSON.stringify(validRecords.slice(-1), null, 2));

  console.log("\n=== DATABASE AUDIT ===");
  const itDept = await prisma.department.findFirst({
    where: { code: "IT" },
  });
  console.log("IT Department in DB:", itDept);

  const nonStudentUsers = await prisma.user.findMany({
    where: { role: { not: "STUDENT" } },
    select: { id: true, name: true, email: true, role: true },
  });
  console.log(`Preserved Non-Student Users count: ${nonStudentUsers.length}`);
  const nonStudentEmails = new Set(nonStudentUsers.map(u => u.email.toLowerCase()));

  const conflictingEmails = validRecords.filter(r => nonStudentEmails.has(r.email));
  console.log(`Conflicts with non-student emails: ${conflictingEmails.length}`);
  if (conflictingEmails.length > 0) {
    console.log("Conflicts:", conflictingEmails);
    for (const c of conflictingEmails) {
      const existing = await prisma.user.findUnique({
        where: { email: c.email },
        include: {
          facultyProfile: true,
          hodProfile: true,
          coordinatorProfile: true,
          adminProfile: true,
          studentProfile: true,
          approvalsMade: true,
          approvalsReceived: true,
        },
      });
      console.log(`DB User details for ${c.email}:`, JSON.stringify(existing, null, 2));
    }
  }

  const existingStudentUsers = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      studentProfile: true,
      approvalsMade: true,
      approvalsReceived: true,
    },
  });
  console.log(`Existing STUDENT Users: ${existingStudentUsers.length}`);

  const existingStudentProfiles = await prisma.studentProfile.findMany({
    include: {
      subjectEnrollments: true,
      attendanceRecords: true,
    },
  });
  console.log(`Existing StudentProfiles: ${existingStudentProfiles.length}`);

  console.log("\n=== ALL EXISTING USERS IN DATABASE ===");
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      studentProfile: { select: { id: true, studentId: true, rollNo: true } },
      facultyProfile: { select: { id: true, employeeId: true } },
      hodProfile: { select: { id: true, employeeId: true } },
      coordinatorProfile: { select: { id: true, employeeId: true } },
      adminProfile: { select: { id: true, employeeId: true } },
    },
    orderBy: { role: "asc" },
  });
  console.log(JSON.stringify(allUsers, null, 2));

  const totalAttendanceRecords = await prisma.attendanceRecord.count();
  console.log(`Existing AttendanceRecord count: ${totalAttendanceRecords}`);

  const totalAttendanceSessions = await prisma.attendanceSession.count();
  console.log(`Existing AttendanceSession count: ${totalAttendanceSessions}`);

  const studentApprovalLogs = await prisma.approvalLog.findMany({
    where: {
      OR: [
        { target: { role: "STUDENT" } },
        { reviewer: { role: "STUDENT" } },
      ],
    },
  });
  console.log(`Existing ApprovalLogs involving students: ${studentApprovalLogs.length}`);

  console.log("\nPreserved System Data Summary:");
  const facultyCount = await prisma.facultyProfile.count();
  const hodCount = await prisma.hODProfile.count();
  const coordCount = await prisma.coordinatorProfile.count();
  const adminCount = await prisma.adminProfile.count();
  const deptCount = await prisma.department.count();
  const subjectCount = await prisma.subject.count();
  const assignmentCount = await prisma.facultySubjectAssignment.count();
  console.log(`- FacultyProfiles: ${facultyCount}`);
  console.log(`- HODProfiles: ${hodCount}`);
  console.log(`- CoordinatorProfiles: ${coordCount}`);
  console.log(`- AdminProfiles: ${adminCount}`);
  console.log(`- Departments: ${deptCount}`);
  console.log(`- Subjects: ${subjectCount}`);
  console.log(`- FacultySubjectAssignments: ${assignmentCount}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error("Audit error:", e);
  process.exit(1);
});
