require("dotenv").config();
const prisma = require("../src/config/prisma");

async function check() {
  const students = await prisma.studentProfile.findMany({
    include: { user: true, department: true },
    orderBy: { rollNo: "asc" },
  });

  console.log("=== STUDENTS (count:", students.length, ") ===");
  const divCounts = {};
  students.forEach((s) => {
    divCounts[s.division] = (divCounts[s.division] || 0) + 1;
  });
  console.log("Division counts:", divCounts);
  console.log("Sample students:", students.slice(0, 3).map(s => ({
    id: s.id,
    rollNo: s.rollNo,
    studentId: s.studentId,
    name: s.user?.name,
    division: s.division,
    year: s.year,
    semester: s.semester,
    academicYear: s.academicYear,
    enrollmentStatus: s.enrollmentStatus,
    deptCode: s.departmentCode,
  })));

  const enrollmentsCount = await prisma.studentSubjectEnrollment.count();
  console.log("\n=== STUDENT SUBJECT ENROLLMENTS ===");
  console.log("Total enrollments:", enrollmentsCount);

  const assignments = await prisma.facultySubjectAssignment.findMany({
    include: {
      faculty: { include: { user: true, department: true } },
      subject: true,
    },
  });
  console.log("\n=== FACULTY SUBJECT ASSIGNMENTS (count:", assignments.length, ") ===");
  assignments.forEach((a) => {
    console.log({
      id: a.id,
      facultyId: a.facultyId,
      facultyName: a.faculty?.user?.name,
      facultyEmail: a.faculty?.user?.email,
      facultyDept: a.faculty?.department?.code || a.faculty?.departmentName,
      subjectId: a.subjectId,
      subjectCode: a.subject?.subjectCode,
      subjectName: a.subject?.subjectName,
      subjectYear: a.subject?.year,
      subjectSem: a.subject?.semester,
      academicYear: a.academicYear,
      division: a.division,
    });
  });

  const users = await prisma.user.findMany({
    where: { role: "FACULTY" },
    include: { facultyProfile: true },
  });
  console.log("\n=== FACULTY USERS (count:", users.length, ") ===");
  users.forEach((u) => {
    console.log({
      id: u.id,
      name: u.name,
      email: u.email,
      status: u.status,
      facultyProfileId: u.facultyProfile?.id,
      deptName: u.facultyProfile?.departmentName,
    });
  });

  await prisma.$disconnect();
}

check().catch(console.error);
