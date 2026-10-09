require("dotenv").config();
const attendanceService = require("../src/services/attendance.service");
const prisma = require("../src/config/prisma");

async function checkAssignments() {
  const kirti = await prisma.user.findFirst({
    where: { email: "kirti.faculty@example.com" }
  });
  console.log("Kirti user:", kirti.id);
  const data = await attendanceService.listFacultyAssignments(kirti.id);
  console.log("Kirti assignments:", JSON.stringify(data.assignments, null, 2));

  await prisma.$disconnect();
}

checkAssignments().catch(console.error);
