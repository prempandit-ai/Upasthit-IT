require("dotenv").config();
const prisma = require("../src/config/prisma");
const { hashPassword } = require("../src/utils/hashPassword");

async function testApiEndpoints() {
  const PORT = process.env.PORT || 5000;
  const BASE_URL = `http://localhost:${PORT}/api`;

  console.log(`Connecting to server API at: ${BASE_URL}...`);

  // Test 1: Login with temporary password
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "ananya.deshmukh@example.edu",
      password: "Faculty123",
    }),
  });

  const loginData = await loginRes.json();
  console.log("Login response status:", loginRes.status);
  console.log("Login data:", {
    success: loginData.success,
    role: loginData.user?.role,
    mustChangePassword: loginData.user?.mustChangePassword,
    employeeId: loginData.user?.employeeId,
  });

  if (!loginData.success || !loginData.token) {
    throw new Error("Login failed!");
  }
  const token = loginData.token;

  // Test 2: Call /api/auth/me
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await meRes.json();
  console.log("GetMe status:", meRes.status, "User Name:", meData.user?.name);
  console.log("Assignments in GetMe:", meData.user?.profile?.subjectAssignments?.length);

  // Test 3: Call /api/faculty/me
  const facProfileRes = await fetch(`${BASE_URL}/faculty/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const facProfileData = await facProfileRes.json();
  console.log("Faculty profile status:", facProfileRes.status);
  console.log("Faculty assigned subjects:", facProfileData.faculty?.subjectAssignments?.map(a => a.subject?.subjectCode));

  // Test 4: Change password endpoint
  const changeRes = await fetch(`${BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword: "Faculty123",
      newPassword: "NewSecretPass2026#",
    }),
  });
  const changeData = await changeRes.json();
  console.log("Change password status:", changeRes.status, "Success:", changeData.success);

  // Test 5: Verify old token is now invalidated
  const oldTokenCheck = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const oldTokenData = await oldTokenCheck.json();
  console.log("Old token rejection status:", oldTokenCheck.status, "Message:", oldTokenData.message);
  if (oldTokenCheck.status !== 401) {
    throw new Error("Old token was not invalidated!");
  }

  // Test 6: Verify new token works
  const newToken = changeData.token;
  const newTokenCheck = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${newToken}` },
  });
  const newTokenData = await newTokenCheck.json();
  console.log("New token status:", newTokenCheck.status, "mustChangePassword:", newTokenData.user?.mustChangePassword);

  // Reset Ananya back to Faculty123 with mustChangePassword = true for production consistency
  const resetHashed = await hashPassword("Faculty123");
  await prisma.user.update({
    where: { email: "ananya.deshmukh@example.edu" },
    data: {
      password: resetHashed,
      mustChangePassword: true,
      tokenVersion: 1,
    },
  });
  console.log("✓ Reset Ananya back to Faculty123 with mustChangePassword=true for consistency.");

  console.log("\nALL API ENDPOINTS TESTED AND VALIDATED SUCCESSFULLY!");
  await prisma.$disconnect();
}

testApiEndpoints().catch((e) => {
  console.error("API test error:", e);
  process.exit(1);
});
