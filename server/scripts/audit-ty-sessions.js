require('dotenv').config();
const prisma = require('../src/config/prisma');
async function run() {
  const tySubjects = await prisma.subject.findMany({ where: { year: 'TY' } });
  console.log('TY Subjects:', tySubjects.length, JSON.stringify(tySubjects.map(s => ({ id: s.id, code: s.subjectCode, sem: s.semester, year: s.academicYear }))));

  const tyAssignments = await prisma.facultySubjectAssignment.findMany({
    include: { subject: true, faculty: { include: { user: { select: { name: true } } } } },
    where: { subject: { year: 'TY' } }
  });
  console.log('\nTY FacultySubjectAssignments:', tyAssignments.length);
  tyAssignments.forEach(a => console.log(JSON.stringify({ id: a.id, facultyName: a.faculty?.user?.name, subjectCode: a.subject?.subjectCode, academicYear: a.academicYear, division: a.division })));

  const sessions = await prisma.attendanceSession.findMany({ orderBy: { id: 'asc' } });
  console.log('\nAll sessions:', sessions.length);
  sessions.forEach(s => console.log(JSON.stringify({ id: s.id, assignmentId: s.assignmentId, year: s.year, division: s.division, status: s.status, date: s.sessionDate.toISOString().split('T')[0] })));

  const recordCount = await prisma.attendanceRecord.count();
  console.log('Total attendance records in DB:', recordCount);

  await prisma.$disconnect();
}
run().catch(console.error);
