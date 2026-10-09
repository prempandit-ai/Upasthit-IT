require("dotenv").config();
const prisma = require("../src/config/prisma");

async function main() {
  console.log("Adding mustChangePassword and tokenVersion columns to User table if not existing...");
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;'
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;'
  );
  console.log("Columns verified in PostgreSQL.");

  const cols = await prisma.$queryRawUnsafe(
    "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'User' ORDER BY ordinal_position"
  );
  console.log("Current User columns:");
  cols.forEach((c) => console.log(` - ${c.column_name}: ${c.data_type} (default: ${c.column_default})`));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
