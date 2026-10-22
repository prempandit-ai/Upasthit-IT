require('dotenv').config();
const prisma = require('../src/config/prisma');

async function run() {
  // Check subjects in DB
  const subjects = await prisma.subject.findMany({ include: { department: true }, orderBy: { id: 'asc' } });
  console.log('=== SUBJECTS ===');
  subjects.forEach(s => console.log({ id: s.id, code: s.subjectCode, name: s.subjectName, year: s.year, sem: s.semester, academicYear: s.academicYear, deptCode: s.departmentCode, dept: s.department?.code }));

  // Check TY students
  const tyStudents = await prisma.studentProfile.findMany({ where: { year: 'TY' } });
  console.log('\n=== TY STUDENTS count:', tyStudents.length, '===');
  if (tyStudents.length > 0) {
    tyStudents.slice(0, 3).forEach(s => console.log({ id: s.id, rollNo: s.rollNo, year: s.year, division: s.division, academicYear: s.academicYear }));
  }

  // Check enrollments per subject
  const enrollmentsBySubject = await prisma.studentSubjectEnrollment.groupBy({
    by: ['subjectId'],
    _count: { id: true }
  });
  console.log('\n=== ENROLLMENTS BY SUBJECT ===');
  console.log(enrollmentsBySubject);

  // Check Ashwini Rahude faculty profile issue
  const ashwini = await prisma.user.findUnique({ 
    where: { email: 'ashwinimam@gmail.com' }, 
    include: { facultyProfile: { include: { department: true } } } 
  });
  console.log('\n=== ASHWINI USER ===');
  if (ashwini) {
    console.log({ name: ashwini.name, email: ashwini.email, status: ashwini.status, role: ashwini.role, hasFacultyProfile: !!ashwini.facultyProfile, profileDept: ashwini.facultyProfile?.departmentName });
  } else {
    console.log('User not found');
  }

  // Check which faculty have faculty profiles with department
  const allFacultyProfiles = await prisma.facultyProfile.findMany({ include: { department: true, user: { select: { name: true, email: true, status: true } } } });
  console.log('\n=== ALL FACULTY PROFILES ===');
  allFacultyProfiles.forEach(fp => console.log({
    id: fp.id,
    name: fp.user?.name,
    email: fp.user?.email,
    status: fp.user?.status,
    deptId: fp.departmentId,
    deptCode: fp.department?.code,
    deptName: fp.departmentName,
  }));

  await prisma.$disconnect();
}
run().catch(console.error);
