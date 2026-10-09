require("dotenv").config();
const prisma = require("../src/config/prisma");

async function main() {
  console.log("Adding attendance columns to AttendanceSession table if not existing...");
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "AttendanceSession" ADD COLUMN IF NOT EXISTS "attendanceType" TEXT;'
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "AttendanceSession" ADD COLUMN IF NOT EXISTS "sessionType" TEXT;'
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "AttendanceSession" ADD COLUMN IF NOT EXISTS "lectureTime" TEXT;'
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "AttendanceSession" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);'
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "AttendanceSession" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);'
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "AttendanceSession" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);'
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "AttendanceSession" ADD COLUMN IF NOT EXISTS "windowDurationSeconds" INTEGER NOT NULL DEFAULT 300;'
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "AttendanceSession" ADD COLUMN IF NOT EXISTS "joinCode" TEXT;'
  );

  console.log("Columns verified in AttendanceSession.");

  const cols = await prisma.$queryRawUnsafe(
    "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'AttendanceSession' ORDER BY ordinal_position"
  );
  console.log("Current AttendanceSession columns:");
  cols.forEach((c) => console.log(` - ${c.column_name}: ${c.data_type} (default: ${c.column_default})`));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
