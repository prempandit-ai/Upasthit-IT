require("dotenv").config();
const prisma = require("../src/config/prisma");

async function fixEnum() {
  console.log("Adding NOT_STARTED to AttendanceSessionStatus enum...");
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "AttendanceSessionStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED' BEFORE 'ACTIVE';`
  );
  console.log("Updated enum!");

  const enumVals = await prisma.$queryRaw`
    SELECT e.enumlabel
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'AttendanceSessionStatus';
  `;
  console.log("New enum values:", enumVals);
  await prisma.$disconnect();
}

fixEnum().catch(console.error);
