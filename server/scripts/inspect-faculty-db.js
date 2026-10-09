require("dotenv").config();
const prisma = require("../src/config/prisma");

async function inspectDb() {
  const usersByRole = await prisma.user.groupBy({
    by: ["role"],
    _count: { id: true }
  });
  console.log("=== USERS BY ROLE ===");
  console.log(usersByRole);

  const cols = await prisma.$queryRawUnsafe(
    "SELECT column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'User'"
  );
  console.log("=== USER TABLE COLUMNS ===");
  console.log(cols);

  const faculties = await prisma.user.findMany({
    where: { role: "FACULTY" },
    include: {
      facultyProfile: {
        include: {
          department: true,
          subjectAssignments: {
            include: {
              subject: true,
              attendanceSessions: {
                include: {
                  _count: { select: { records: true } }
                }
              }
            }
          }
        }
      }
    }
  });

  console.log(`\n=== FACULTY USERS IN DB (${faculties.length}) ===`);
  faculties.forEach((f) => {
    console.log(
      JSON.stringify(
        {
          id: f.id,
          name: f.name,
          email: f.email,
          status: f.status,
          isActive: f.isActive,
          profile: f.facultyProfile
            ? {
                id: f.facultyProfile.id,
                employeeId: f.facultyProfile.employeeId,
                designation: f.facultyProfile.designation,
                department: f.facultyProfile.department?.code,
                departmentName: f.facultyProfile.departmentName,
                assignmentsCount: f.facultyProfile.subjectAssignments.length,
                assignments: f.facultyProfile.subjectAssignments.map((a) => ({
                  id: a.id,
                  subjectCode: a.subject.subjectCode,
                  subjectName: a.subject.subjectName,
                  academicYear: a.academicYear,
                  division: a.division,
                  sessionsCount: a.attendanceSessions.length,
                  recordsCount: a.attendanceSessions.reduce(
                    (acc, s) => acc + s._count.records,
                    0
                  )
                }))
              }
            : null
        },
        null,
        2
      )
    );
  });

  const subjects = await prisma.subject.findMany({
    include: {
      department: true,
      _count: {
        select: { facultyAssignments: true, studentEnrollments: true }
      }
    }
  });
  console.log(`\n=== SUBJECTS IN DB (${subjects.length}) ===`);
  subjects.forEach((s) => {
    console.log({
      id: s.id,
      code: s.subjectCode,
      name: s.subjectName,
      dept: s.department?.code || s.departmentCode,
      sem: s.semester,
      year: s.year,
      acadYear: s.academicYear,
      assignments: s._count.facultyAssignments,
      enrollments: s._count.studentEnrollments
    });
  });

  const departments = await prisma.department.findMany();
  console.log(`\n=== DEPARTMENTS IN DB (${departments.length}) ===`, departments);

  const totalSessions = await prisma.attendanceSession.count();
  const totalRecords = await prisma.attendanceRecord.count();
  console.log(`\n=== ATTENDANCE TOTALS ===`);
  console.log(`Sessions: ${totalSessions}, Records: ${totalRecords}`);

  await prisma.$disconnect();
}

inspectDb().catch((e) => {
  console.error("Inspection error:", e);
  process.exit(1);
});
