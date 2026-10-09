require("dotenv").config();
const prisma = require("../src/config/prisma");

async function checkSubjects() {
  const subjects = await prisma.subject.findMany({
    include: {
      facultyAssignments: {
        include: { faculty: { include: { user: true } } }
      },
      studentEnrollments: true,
      department: true
    }
  });

  console.log("=== ALL SUBJECTS (count:", subjects.length, ") ===");
  subjects.forEach(s => {
    console.log({
      id: s.id,
      code: s.subjectCode,
      name: s.subjectName,
      type: s.subjectType,
      year: s.year,
      sem: s.semester,
      academicYear: s.academicYear,
      dept: s.department?.code || s.departmentCode,
      faculty: s.facultyAssignments.map(fa => fa.faculty.user.name),
      enrollmentsCount: s.studentEnrollments.length
    });
  });

  await prisma.$disconnect();
}

checkSubjects().catch(console.error);
