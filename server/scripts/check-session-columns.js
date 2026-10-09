require("dotenv").config();
const prisma = require("../src/config/prisma");

async function checkCols() {
  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name ILIKE '%AttendanceSession%'
    ORDER BY ordinal_position;
  `;
  console.log("Columns of AttendanceSession in live DB:", cols);
  await prisma.$disconnect();
}

checkCols().catch(console.error);
