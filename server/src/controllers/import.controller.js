const path = require("path");
const XLSX = require("xlsx");
const prisma = require("../config/prisma");
const { hashPassword } = require("../utils/hashPassword");

// ─── Helper: safe string ───────────────────────────────────────────────────────
const str = (v) => (v !== null && v !== undefined ? String(v).trim() : "");
const num = (v) => (v !== null && v !== undefined && !isNaN(v) ? parseInt(v) : null);

// ─── Import Subjects ───────────────────────────────────────────────────────────
exports.importSubjects = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    const results = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      failed: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      // Flexible header mapping (case-insensitive)
      const subjectCode = str(row["Subject Code"] || row["SubjectCode"] || row["CODE"] || row["code"]);
      const subjectName = str(row["Subject Name"] || row["SubjectName"] || row["NAME"] || row["name"]);
      const subjectType = str(row["Type"] || row["SubjectType"] || row["type"] || "THEORY").toUpperCase();
      const credits     = num(row["Credits"] || row["credits"]);
      const deptCode    = str(row["Department Code"] || row["DepartmentCode"] || row["Dept"] || row["dept"]).toUpperCase();
      const acadYear    = str(row["Academic Year"] || row["AcademicYear"] || row["Year"] || "");
      const semester    = num(row["Semester"] || row["semester"] || row["SEM"]);
      const yearVal     = str(row["Year Level"] || row["YearLevel"] || row["Level"] || row["BE/TE"] || "").toUpperCase();

      if (!subjectCode) {
        results.failed.push({ row: rowNum, reason: "Missing Subject Code" });
        results.skipped++;
        continue;
      }
      if (!subjectName) {
        results.failed.push({ row: rowNum, reason: "Missing Subject Name", subjectCode });
        results.skipped++;
        continue;
      }
      if (!semester) {
        results.failed.push({ row: rowNum, reason: "Missing/invalid Semester", subjectCode });
        results.skipped++;
        continue;
      }

      const validTypes = ["THEORY", "PRACTICAL", "ELECTIVE", "AUDIT"];
      const resolvedType = validTypes.includes(subjectType) ? subjectType : "THEORY";

      const validYears = ["FY", "SY", "TY", "BE"];
      const resolvedYear = validYears.includes(yearVal) ? yearVal : "BE";

      // Resolve department FK
      let departmentId = null;
      if (deptCode) {
        const dept = await prisma.department.findUnique({ where: { code: deptCode } });
        if (dept) departmentId = dept.id;
      }

      try {
        await prisma.subject.upsert({
          where: { subjectCode },
          update: {
            subjectName,
            subjectType: resolvedType,
            credits,
            departmentCode: deptCode,
            departmentId,
            academicYear: acadYear,
            semester,
            year: resolvedYear,
          },
          create: {
            subjectCode,
            subjectName,
            subjectType: resolvedType,
            credits,
            departmentCode: deptCode,
            departmentId,
            academicYear: acadYear,
            semester,
            year: resolvedYear,
          },
        });
        results.imported++;
      } catch (err) {
        results.failed.push({ row: rowNum, reason: err.message, subjectCode });
        results.skipped++;
      }
    }

    return res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

// ─── Import Faculty ────────────────────────────────────────────────────────────
exports.importFaculty = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    const results = { total: rows.length, imported: 0, skipped: 0, failed: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const employeeId   = str(row["Employee ID"] || row["EmployeeID"] || row["Emp ID"] || row["emp_id"]);
      const name         = str(row["Name"] || row["Faculty Name"] || row["name"]);
      const email        = str(row["Email"] || row["email"]).toLowerCase();
      const mobileNumber = str(row["Mobile"] || row["Mobile Number"] || row["Phone"] || "");
      const designation  = str(row["Designation"] || row["designation"] || "");
      const deptCode     = str(row["Department Code"] || row["DepartmentCode"] || row["Dept"] || "").toUpperCase();
      const deptName     = str(row["Department Name"] || row["DepartmentName"] || row["Department"] || "");
      const defaultPwd   = str(row["Password"] || row["password"] || "Faculty@123");

      if (!employeeId) {
        results.failed.push({ row: rowNum, reason: "Missing Employee ID" });
        results.skipped++;
        continue;
      }
      if (!name) {
        results.failed.push({ row: rowNum, reason: "Missing Name", employeeId });
        results.skipped++;
        continue;
      }
      if (!email || !email.includes("@")) {
        results.failed.push({ row: rowNum, reason: "Missing/invalid Email", employeeId });
        results.skipped++;
        continue;
      }

      let departmentId = null;
      if (deptCode) {
        const dept = await prisma.department.findUnique({ where: { code: deptCode } });
        if (dept) departmentId = dept.id;
      }

      try {
        await prisma.$transaction(async (tx) => {
          // Check if user exists by email
          let user = await tx.user.findUnique({ where: { email } });

          if (!user) {
            const hashed = await hashPassword(defaultPwd || "Faculty@123");
            user = await tx.user.create({
              data: {
                name,
                email,
                password: hashed,
                role: "FACULTY",
                status: "APPROVED",
              },
            });
          }

          // Upsert faculty profile
          const existing = await tx.facultyProfile.findUnique({ where: { employeeId } });
          if (existing) {
            await tx.facultyProfile.update({
              where: { employeeId },
              data: {
                mobileNumber: mobileNumber || null,
                designation: designation || null,
                departmentCode: deptCode,
                departmentName: deptName,
                departmentId,
              },
            });
          } else {
            await tx.facultyProfile.create({
              data: {
                userId: user.id,
                employeeId,
                mobileNumber: mobileNumber || null,
                designation: designation || null,
                departmentCode: deptCode,
                departmentName: deptName,
                departmentId,
              },
            });
          }
        });

        results.imported++;
      } catch (err) {
        results.failed.push({ row: rowNum, reason: err.message, employeeId });
        results.skipped++;
      }
    }

    return res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

// ─── Import Students ───────────────────────────────────────────────────────────
exports.importStudents = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    const results = { total: rows.length, imported: 0, skipped: 0, failed: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const studentId      = str(row["Student ID"] || row["StudentID"] || row["GR No"] || row["GR Number"] || row["gr_no"]);
      const name           = str(row["Name"] || row["Student Name"] || row["name"]);
      const email          = str(row["Email"] || row["email"]).toLowerCase();
      const rollNo         = num(row["Roll No"] || row["RollNo"] || row["Roll"] || row["roll_no"]);
      const enrollmentNo   = str(row["Enrollment No"] || row["EnrollmentNo"] || row["enrollment_no"] || "");
      const mobileNumber   = str(row["Mobile"] || row["Mobile Number"] || row["Phone"] || "");
      const deptCode       = str(row["Department Code"] || row["DepartmentCode"] || row["Dept Code"] || "").toUpperCase();
      const deptName       = str(row["Department Name"] || row["DepartmentName"] || row["Department"] || "");
      const academicYear   = str(row["Academic Year"] || row["AcademicYear"] || "");
      const semesterVal    = num(row["Semester"] || row["semester"] || row["SEM"]);
      const division       = str(row["Division"] || row["Div"] || row["div"] || "").toUpperCase();
      const yearRaw        = str(row["Year"] || row["Year Level"] || row["Level"] || "BE").toUpperCase();
      const defaultPwd     = str(row["Password"] || row["password"] || "Student@123");

      const validYears = ["FY", "SY", "TY", "BE"];
      const yearVal = validYears.includes(yearRaw) ? yearRaw : "BE";

      if (!studentId) {
        results.failed.push({ row: rowNum, reason: "Missing Student ID / GR No" });
        results.skipped++;
        continue;
      }
      if (!name) {
        results.failed.push({ row: rowNum, reason: "Missing Name", studentId });
        results.skipped++;
        continue;
      }
      if (!email || !email.includes("@")) {
        results.failed.push({ row: rowNum, reason: "Missing/invalid Email", studentId });
        results.skipped++;
        continue;
      }

      let departmentId = null;
      if (deptCode) {
        const dept = await prisma.department.findUnique({ where: { code: deptCode } });
        if (dept) departmentId = dept.id;
      }

      try {
        await prisma.$transaction(async (tx) => {
          let user = await tx.user.findUnique({ where: { email } });

          if (!user) {
            const hashed = await hashPassword(defaultPwd || "Student@123");
            user = await tx.user.create({
              data: {
                name,
                email,
                password: hashed,
                role: "STUDENT",
                status: "APPROVED",
              },
            });
          }

          const existing = await tx.studentProfile.findUnique({ where: { studentId } });

          if (existing) {
            await tx.studentProfile.update({
              where: { studentId },
              data: {
                rollNo,
                mobileNumber: mobileNumber || null,
                departmentCode: deptCode,
                departmentName: deptName,
                departmentId,
                academicYear,
                semester: semesterVal || 1,
                division: division || null,
                year: yearVal,
                enrollmentNo: enrollmentNo || null,
              },
            });
          } else {
            await tx.studentProfile.create({
              data: {
                userId: user.id,
                studentId,
                rollNo,
                enrollmentNo: enrollmentNo || null,
                mobileNumber: mobileNumber || null,
                departmentCode: deptCode,
                departmentName: deptName,
                departmentId,
                academicYear,
                semester: semesterVal || 1,
                division: division || null,
                year: yearVal,
              },
            });
          }
        });

        results.imported++;
      } catch (err) {
        results.failed.push({ row: rowNum, reason: err.message, studentId });
        results.skipped++;
      }
    }

    return res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

// ─── Read sheet names from uploaded Excel ──────────────────────────────────────
exports.previewFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const preview = workbook.SheetNames.map((name) => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: "" });
      return {
        sheet: name,
        rowCount: rows.length,
        headers: rows.length > 0 ? Object.keys(rows[0]) : [],
        sampleRow: rows[0] || null,
      };
    });

    return res.json({ success: true, sheets: preview });
  } catch (error) {
    next(error);
  }
};
