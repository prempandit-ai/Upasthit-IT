require("dotenv").config();
const jwt = require("jsonwebtoken");
const prisma = require("../src/config/prisma");

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function testHttpEndpoints() {
  console.log(`Testing HTTP Endpoints at ${BASE_URL}...`);

  const kirti = await prisma.user.findFirst({
    where: { email: "kirti.faculty@example.com" },
  });
  if (!kirti) throw new Error("Kirti not found");

  // Sign JWT matching auth.middleware
  const token = jwt.sign(
    {
      userId: kirti.id,
      id: kirti.id,
      role: kirti.role,
      status: kirti.status,
      tokenVersion: kirti.tokenVersion || 0,
    },
    process.env.JWT_SECRET || "upasthit_super_secret_jwt_key_2026",
    { expiresIn: "1h" }
  );

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // 1. GET /api/attendance/students?year=BE&semester=7&division=Div%20A
  const resA = await fetch(`${BASE_URL}/api/attendance/students?year=BE&semester=7&division=Div%20A`, { headers });
  const dataA = await resA.json();
  console.log(`HTTP GET /students?division=Div A -> status ${resA.status}, count: ${dataA.count} (Expected: 15)`);
  if (dataA.count !== 15) throw new Error(`Expected 15, got ${dataA.count}`);

  // 2. GET /api/attendance/students?year=BE&semester=7&division=Div%20B
  const resB = await fetch(`${BASE_URL}/api/attendance/students?year=BE&semester=7&division=Div%20B`, { headers });
  const dataB = await resB.json();
  console.log(`HTTP GET /students?division=Div B -> status ${resB.status}, count: ${dataB.count} (Expected: 15)`);
  if (dataB.count !== 15) throw new Error(`Expected 15, got ${dataB.count}`);

  // 3. GET /api/attendance/students?year=BE&semester=7&division=All%20Divisions
  const resAll = await fetch(`${BASE_URL}/api/attendance/students?year=BE&semester=7&division=All%20Divisions`, { headers });
  const dataAll = await resAll.json();
  console.log(`HTTP GET /students?division=All Divisions -> status ${resAll.status}, count: ${dataAll.count} (Expected: 30)`);
  if (dataAll.count !== 30) throw new Error(`Expected 30, got ${dataAll.count}`);

  // 4. GET /api/attendance/eligible-students?assignmentId=8&division=Div%20A
  const resElA = await fetch(`${BASE_URL}/api/attendance/eligible-students?assignmentId=8&division=Div%20A`, { headers });
  const dataElA = await resElA.json();
  console.log(`HTTP GET /eligible-students?assignmentId=8&division=Div A -> status ${resElA.status}, count: ${dataElA.students?.length} (Expected: 15)`);
  if (dataElA.students?.length !== 15) throw new Error(`Expected 15, got ${dataElA.students?.length}`);

  console.log("\n✓ ALL HTTP API ENDPOINT CHECKS PASSED!");
  await prisma.$disconnect();
}

testHttpEndpoints().catch(console.error);
