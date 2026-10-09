require("dotenv").config();
const prisma = require("../src/config/prisma");

async function checkCoordinator() {
  console.log("=== COMPREHENSIVE AUDIT FOR panaik16@gmail.com ===");

  const user = await prisma.user.findUnique({
    where: { email: "panaik16@gmail.com" },
    include: {
      coordinatorProfile: true,
      facultyProfile: true,
      hodProfile: true,
      adminProfile: true,
      studentProfile: true,
      approvalsMade: true,
      approvalsReceived: true,
    },
  });

  if (!user) {
    console.log("User panaik16@gmail.com not found!");
    return;
  }

  console.log("1. User Record Details:");
  console.log(JSON.stringify(user, null, 2));

  // Check across all potential tables where user.id could be referenced
  const userId = user.id;

  const [
    coordCount,
    facCount,
    hodCount,
    admCount,
    studCount,
    approvalsMadeCount,
    approvalsReceivedCount,
  ] = await Promise.all([
    prisma.coordinatorProfile.count({ where: { userId } }),
    prisma.facultyProfile.count({ where: { userId } }),
    prisma.hODProfile.count({ where: { userId } }),
    prisma.adminProfile.count({ where: { userId } }),
    prisma.studentProfile.count({ where: { userId } }),
    prisma.approvalLog.count({ where: { reviewerId: userId } }),
    prisma.approvalLog.count({ where: { targetId: userId } }),
  ]);

  console.log("\n2. Direct Foreign Key References:");
  console.log(`- CoordinatorProfile: ${coordCount}`);
  console.log(`- FacultyProfile: ${facCount}`);
  console.log(`- HODProfile: ${hodCount}`);
  console.log(`- AdminProfile: ${admCount}`);
  console.log(`- StudentProfile: ${studCount}`);
  console.log(`- ApprovalLog (Reviewer): ${approvalsMadeCount}`);
  console.log(`- ApprovalLog (Target): ${approvalsReceivedCount}`);

  // Check what other coordinators exist in the system
  console.log("\n3. All other Coordinator Users in System:");
  const allCoordinators = await prisma.user.findMany({
    where: { role: "COORDINATOR" },
    include: { coordinatorProfile: { include: { department: true } } },
  });
  console.log(JSON.stringify(allCoordinators, null, 2));

  await prisma.$disconnect();
}

checkCoordinator().catch((e) => {
  console.error(e);
  process.exit(1);
});
