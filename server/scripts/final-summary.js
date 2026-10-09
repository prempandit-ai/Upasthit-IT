require("dotenv").config();
const prisma = require("../src/config/prisma");

async function summary() {
  const students = await prisma.studentProfile.count();
  const enrollments = await prisma.studentSubjectEnrollment.count();
  const assignments = await prisma.facultySubjectAssignment.count();
  const sessions = await prisma.attendanceSession.count();
  const records = await prisma.attendanceRecord.count();

  console.log("=== UPASTHIT ERP — SYSTEM SUMMARY ===");
  console.log("Students (BE Sem 7 IT):", students);
  console.log("Subject Enrollments:", enrollments, "(30 students × 5 subjects)");
  console.log("Faculty Assignments:", assignments);
  console.log("Attendance Sessions:", sessions);
  console.log("Attendance Records:", records);

  const divA = await prisma.studentSubjectEnrollment.count({
    where: { student: { division: "A" } },
  });
  const divB = await prisma.studentSubjectEnrollment.count({
    where: { student: { division: "B" } },
  });
  console.log("\nEnrollments — Div A:", divA, "| Div B:", divB);

  const beSubjects = await prisma.subject.findMany({
    where: { year: "BE", semester: 7 },
    include: { _count: { select: { enrollments: true } } },
  });
  console.log("\nBE Sem 7 Subjects:");
  beSubjects.forEach((s) => {
    console.log(`  ${s.code} - ${s.name}: ${s._count.enrollments} enrollments`);
  });

  await prisma.$disconnect();
}

summary().catch(console.error);
