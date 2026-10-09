require("dotenv").config();
const prisma = require("../src/config/prisma");

async function enrollBEStudents() {
  console.log("=== ENROLLING BE SEMESTER 7 STUDENTS INTO SUBJECTS ===");

  // 1. Fetch BE Sem 7 students
  const students = await prisma.studentProfile.findMany({
    where: {
      year: "BE",
      semester: 7,
      departmentCode: "IT",
    },
    include: { user: true },
    orderBy: { rollNo: "asc" },
  });

  console.log(`Found ${students.length} BE Sem 7 IT students.`);
  if (students.length === 0) {
    throw new Error("No BE Sem 7 IT students found!");
  }

  // 2. Fetch BE Sem 7 subjects
  const subjects = await prisma.subject.findMany({
    where: {
      year: "BE",
      semester: 7,
      OR: [
        { departmentCode: "IT" },
        { department: { code: "IT" } },
      ],
    },
  });

  console.log(`Found ${subjects.length} BE Sem 7 IT subjects:`, subjects.map(s => `${s.subjectCode} (${s.subjectName})`));
  if (subjects.length === 0) {
    throw new Error("No BE Sem 7 IT subjects found!");
  }

  // 3. Create or upsert enrollments
  let createdCount = 0;
  for (const student of students) {
    for (const subject of subjects) {
      await prisma.studentSubjectEnrollment.upsert({
        where: {
          studentId_subjectId_academicYear: {
            studentId: student.id,
            subjectId: subject.id,
            academicYear: student.academicYear,
          },
        },
        update: {
          status: "ACTIVE",
        },
        create: {
          studentId: student.id,
          subjectId: subject.id,
          academicYear: student.academicYear,
          status: "ACTIVE",
        },
      });
      createdCount++;
    }
  }

  console.log(`✓ Successfully created/updated ${createdCount} StudentSubjectEnrollment records.`);

  const totalEnrollments = await prisma.studentSubjectEnrollment.count();
  console.log(`Total StudentSubjectEnrollment records in DB: ${totalEnrollments}`);

  await prisma.$disconnect();
}

enrollBEStudents().catch((err) => {
  console.error("Enrollment failed:", err);
  process.exit(1);
});
