require("dotenv").config();
const attendanceService = require("../src/services/attendance.service");
const prisma = require("../src/config/prisma");

async function testQuery() {
  const kirti = await prisma.user.findFirst({
    where: { email: "kirti.faculty@example.com" }
  });

  const resA_raw = await attendanceService.listEligibleStudents(kirti.id, {
    assignmentId: 8,
    division: "A",
  });
  console.log("Division 'A' count:", resA_raw.students.length);

  const resDivA = await attendanceService.listEligibleStudents(kirti.id, {
    assignmentId: 8,
    division: "Div A",
  });
  console.log("Division 'Div A' count:", resDivA.students.length);

  const resAll = await attendanceService.listEligibleStudents(kirti.id, {
    assignmentId: 8,
    division: "ALL",
  });
  console.log("Division 'ALL' count:", resAll.students.length);

  await prisma.$disconnect();
}

testQuery().catch(console.error);
