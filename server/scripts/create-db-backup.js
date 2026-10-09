require("dotenv").config();
const fs = require("fs");
const path = require("path");
const prisma = require("../src/config/prisma");

async function createBackup() {
  console.log("Creating full database snapshot backup...");
  const backupDir = path.resolve(__dirname, "../backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFilePath = path.join(backupDir, `db-backup-${timestamp}.json`);

  const snapshot = {
    createdAt: new Date().toISOString(),
    tables: {
      users: await prisma.user.findMany(),
      departments: await prisma.department.findMany(),
      studentProfiles: await prisma.studentProfile.findMany(),
      facultyProfiles: await prisma.facultyProfile.findMany(),
      hodProfiles: await prisma.hODProfile.findMany(),
      coordinatorProfiles: await prisma.coordinatorProfile.findMany(),
      adminProfiles: await prisma.adminProfile.findMany(),
      subjects: await prisma.subject.findMany(),
      facultySubjectAssignments: await prisma.facultySubjectAssignment.findMany(),
      studentSubjectEnrollments: await prisma.studentSubjectEnrollment.findMany(),
      approvalLogs: await prisma.approvalLog.findMany(),
      attendanceSessions: await prisma.attendanceSession.findMany(),
      attendanceRecords: await prisma.attendanceRecord.findMany(),
    },
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`Backup successfully written to: ${backupFilePath}`);
  console.log("Summary of backed-up records:");
  for (const [table, rows] of Object.entries(snapshot.tables)) {
    console.log(`- ${table}: ${rows.length} records`);
  }

  await prisma.$disconnect();
}

createBackup().catch((e) => {
  console.error("Backup failed:", e);
  process.exit(1);
});
