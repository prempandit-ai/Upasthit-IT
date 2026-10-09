require("dotenv").config();
const prisma = require("../src/config/prisma");

async function checkEnum() {
  const enumVals = await prisma.$queryRaw`
    SELECT e.enumlabel
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'AttendanceSessionStatus';
  `;
  console.log("Enum values for AttendanceSessionStatus:", enumVals);
  await prisma.$disconnect();
}

checkEnum().catch(console.error);
