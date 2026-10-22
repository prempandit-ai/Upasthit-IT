/**
 * fix-ty-semester.js
 * 
 * The TY faculty assignments (TEIT501-505) are for semester 5.
 * The TY students were incorrectly created with semester 6.
 * This script corrects them to semester 5 to match the faculty assignments.
 * 
 * SAFE: only updates StudentProfile.semester for TY students, does not touch enrollments.
 */

require('dotenv').config();
const prisma = require('../src/config/prisma');

async function run() {
  console.log('=== FIX TY SEMESTER: 6 → 5 ===\n');

  // Verify the faculty assignment semesters
  const tyAssignments = await prisma.facultySubjectAssignment.findMany({
    include: { subject: true },
    where: { subject: { year: 'TY' } }
  });
  console.log('TY Faculty assignment semesters:');
  const semesters = [...new Set(tyAssignments.map(a => a.subject.semester))];
  console.log('  Unique semesters used in TY assignments:', semesters.join(', '));

  // Get current TY students
  const tyStudents = await prisma.studentProfile.findMany({ where: { year: 'TY' } });
  console.log('\nCurrent TY students count:', tyStudents.length);
  const semesterCounts = {};
  tyStudents.forEach(s => { semesterCounts[s.semester] = (semesterCounts[s.semester] || 0) + 1; });
  console.log('Semester distribution:', JSON.stringify(semesterCounts));

  // Update all TY students to semester 5 (matching TEIT501-505 assignments)
  if (semesterCounts[6] > 0) {
    const result = await prisma.studentProfile.updateMany({
      where: { year: 'TY', semester: 6 },
      data: { semester: 5 }
    });
    console.log('\n✓ Updated', result.count, 'TY students from semester 6 to semester 5');
  } else {
    console.log('\nNo TY students with semester 6 found, no update needed');
  }

  // Verify after update
  const afterStudents = await prisma.studentProfile.findMany({ where: { year: 'TY' } });
  const afterSemCounts = {};
  afterStudents.forEach(s => { afterSemCounts[s.semester] = (afterSemCounts[s.semester] || 0) + 1; });
  console.log('After update - semester distribution:', JSON.stringify(afterSemCounts));
  
  const divCounts = {};
  afterStudents.forEach(s => { divCounts[s.division] = (divCounts[s.division] || 0) + 1; });
  console.log('After update - division distribution:', JSON.stringify(divCounts));

  await prisma.$disconnect();
  console.log('\n✓ Semester fix completed.');
}

run().catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});
