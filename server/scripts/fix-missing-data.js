/**
 * fix-missing-data.js
 * 
 * Fixes two confirmed data gaps in the UPASTHIT database:
 * 1. TY students (TY-A: 15, TY-B: 15) are completely absent from StudentProfile
 * 2. Ashwini Rahude (ashwinimam@gmail.com) has a FACULTY User record but no FacultyProfile
 * 
 * This script:
 * - Inserts 30 TY IT students (sem 5 & sem 6, academic year 2025-26)
 * - Enrolls each TY student in all TY IT subjects
 * - Creates a FacultyProfile for Ashwini Rahude with IT department linkage
 * 
 * SAFE: uses upsert – will not create duplicates if re-run.
 * SAFE: does not touch existing BE students, BE faculty, or sessions.
 */

require('dotenv').config();
const prisma = require('../src/config/prisma');
const { hashPassword } = require('../src/utils/hashPassword');

const TY_ACADEMIC_YEAR = '2025-26';
const TY_SEMESTER = 6;  // Sem 6 for TY IT (as per existing subjects IT601-IT604)
const IT_DEPT_CODE = 'IT';

// 15 names for TY-A
const TY_A_STUDENTS = [
  'AGARWAL PRIYA SURESH ANITA',
  'BHOSALE ROHIT DATTATRAY SUNITA',
  'CHAVAN SNEHA VIJAY MEENA',
  'DESAI NIKHIL RAMESH KALPANA',
  'GHARAT POOJA SANTOSH LAXMI',
  'JOSHI ADITYA SUBHASH REKHA',
  'KADAM SHRUTI MADHUKAR PUSHPA',
  'LELE GAURAV PRAKASH USHA',
  'MANE PALLAVI DINESH SAVITA',
  'NAIK SIDDHARTH SURESH ARCHANA',
  'PAWAR KOMAL ANIL VANDANA',
  'RANE VIVEK RAJESH NANDA',
  'SAWANT DIVYA MILIND SONAL',
  'TIWARI RAHUL KRISHNA GEETA',
  'WAGH AMRUTA SUNIL DEEPA',
];

// 15 names for TY-B
const TY_B_STUDENTS = [
  'AGASHE ANKITA VIKRAM MANALI',
  'BHAT TEJAS GIRISH SWATI',
  'CHITALE NEHA HEMANT JAYSHREE',
  'DESHPANDE YASH NARAYAN SUSHMA',
  'GOKHALE PRACHI SUDHIR VRINDA',
  'INAMDAR ARJUN DATTATRAY NIRMALA',
  'KARVE RITU BABURAO MADHURI',
  'LIMAYE SHUBHAM RAGHUNATH PADMA',
  'MAYEKAR HARSHALI BALAJI GEETA',
  'NIKAM SMITA RAJARAM SULOCHANA',
  'POTE ANANT HARISHCHANDRA SARLA',
  'RAUT ISHAAN CHANDRAKANT SUNANDA',
  'SHINDE MONIKA ARVIND SHOBHA',
  'TALEKAR PRANAV KRISHNA LEELA',
  'VALANJU MEGHNA DNYANESHWAR CHHAYA',
];

async function run() {
  console.log('=== UPASTHIT DATA FIX SCRIPT ===\n');

  // --- 1. Get IT department ---
  const itDept = await prisma.department.findUnique({ where: { code: IT_DEPT_CODE } });
  if (!itDept) throw new Error('IT department not found. Run seed-users.js first.');
  console.log('IT Department found: id =', itDept.id);

  // --- 2. Get all TY subjects ---
  const tySubjects = await prisma.subject.findMany({
    where: {
      year: 'TY',
      OR: [{ departmentCode: IT_DEPT_CODE }, { department: { code: IT_DEPT_CODE } }],
    },
  });
  if (tySubjects.length === 0) throw new Error('No TY subjects found in DB!');
  console.log(`Found ${tySubjects.length} TY subjects:`, tySubjects.map(s => s.subjectCode).join(', '));

  // --- 3. Insert TY-A students ---
  console.log('\n--- Creating TY-A Students ---');
  let tyACreated = 0;
  const tyAStudentProfiles = [];

  for (let i = 0; i < TY_A_STUDENTS.length; i++) {
    const rollNo = i + 1;
    const name = TY_A_STUDENTS[i];
    const email = `ty.a.${String(rollNo).padStart(2, '0')}@student.upasthit.test`;
    const studentId = `2022TYIT0${String(i + 1).padStart(2, '0')}`;
    const enrollmentNo = `TYA2025${String(rollNo).padStart(3, '0')}`;

    const hashedPw = await hashPassword('Student123');

    const user = await prisma.user.upsert({
      where: { email },
      update: { name, role: 'STUDENT', status: 'APPROVED', isActive: true },
      create: {
        name,
        email,
        password: hashedPw,
        role: 'STUDENT',
        status: 'APPROVED',
        isActive: true,
      },
    });

    const profile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        studentId,
        rollNo,
        enrollmentNo,
        enrollmentStatus: 'ACTIVE',
        departmentId: itDept.id,
        departmentCode: IT_DEPT_CODE,
        departmentName: 'Information Technology',
        academicYear: TY_ACADEMIC_YEAR,
        semester: TY_SEMESTER,
        division: 'A',
        year: 'TY',
      },
      create: {
        userId: user.id,
        studentId,
        rollNo,
        enrollmentNo,
        enrollmentStatus: 'ACTIVE',
        departmentId: itDept.id,
        departmentCode: IT_DEPT_CODE,
        departmentName: 'Information Technology',
        academicYear: TY_ACADEMIC_YEAR,
        semester: TY_SEMESTER,
        division: 'A',
        year: 'TY',
      },
    });

    tyAStudentProfiles.push(profile);
    tyACreated++;
    console.log(`  [${rollNo}] ${name} (${email}) → ProfileId: ${profile.id}`);
  }
  console.log(`✓ TY-A: ${tyACreated} students created/updated`);

  // --- 4. Insert TY-B students ---
  console.log('\n--- Creating TY-B Students ---');
  let tyBCreated = 0;
  const tyBStudentProfiles = [];

  for (let i = 0; i < TY_B_STUDENTS.length; i++) {
    const rollNo = i + 1;
    const name = TY_B_STUDENTS[i];
    const email = `ty.b.${String(rollNo).padStart(2, '0')}@student.upasthit.test`;
    const studentId = `2022TYIT${String(i + 16).padStart(3, '0')}`;
    const enrollmentNo = `TYB2025${String(rollNo).padStart(3, '0')}`;

    const hashedPw = await hashPassword('Student123');

    const user = await prisma.user.upsert({
      where: { email },
      update: { name, role: 'STUDENT', status: 'APPROVED', isActive: true },
      create: {
        name,
        email,
        password: hashedPw,
        role: 'STUDENT',
        status: 'APPROVED',
        isActive: true,
      },
    });

    const profile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        studentId,
        rollNo,
        enrollmentNo,
        enrollmentStatus: 'ACTIVE',
        departmentId: itDept.id,
        departmentCode: IT_DEPT_CODE,
        departmentName: 'Information Technology',
        academicYear: TY_ACADEMIC_YEAR,
        semester: TY_SEMESTER,
        division: 'B',
        year: 'TY',
      },
      create: {
        userId: user.id,
        studentId,
        rollNo,
        enrollmentNo,
        enrollmentStatus: 'ACTIVE',
        departmentId: itDept.id,
        departmentCode: IT_DEPT_CODE,
        departmentName: 'Information Technology',
        academicYear: TY_ACADEMIC_YEAR,
        semester: TY_SEMESTER,
        division: 'B',
        year: 'TY',
      },
    });

    tyBStudentProfiles.push(profile);
    tyBCreated++;
    console.log(`  [${rollNo}] ${name} (${email}) → ProfileId: ${profile.id}`);
  }
  console.log(`✓ TY-B: ${tyBCreated} students created/updated`);

  // --- 5. Enroll all TY students in all TY subjects ---
  console.log('\n--- Enrolling TY students in TY subjects ---');
  let enrollmentCount = 0;
  const allTyProfiles = [...tyAStudentProfiles, ...tyBStudentProfiles];

  for (const student of allTyProfiles) {
    for (const subject of tySubjects) {
      await prisma.studentSubjectEnrollment.upsert({
        where: {
          studentId_subjectId_academicYear: {
            studentId: student.id,
            subjectId: subject.id,
            academicYear: TY_ACADEMIC_YEAR,
          },
        },
        update: { status: 'ACTIVE' },
        create: {
          studentId: student.id,
          subjectId: subject.id,
          academicYear: TY_ACADEMIC_YEAR,
          status: 'ACTIVE',
        },
      });
      enrollmentCount++;
    }
  }
  console.log(`✓ Created/updated ${enrollmentCount} TY student-subject enrollment records`);

  // --- 6. Fix Ashwini Rahude's missing FacultyProfile ---
  console.log('\n--- Fixing Ashwini Rahude FacultyProfile ---');
  const ashwiniUser = await prisma.user.findUnique({ where: { email: 'ashwinimam@gmail.com' } });
  if (!ashwiniUser) {
    console.log('  WARNING: ashwinimam@gmail.com user not found, skipping');
  } else {
    const existingProfile = await prisma.facultyProfile.findUnique({ where: { userId: ashwiniUser.id } });
    if (existingProfile) {
      console.log('  FacultyProfile already exists for Ashwini Rahude, id:', existingProfile.id);
    } else {
      // Create a unique employeeId for Ashwini
      const newProfile = await prisma.facultyProfile.create({
        data: {
          userId: ashwiniUser.id,
          employeeId: 'FAC013',
          designation: 'Assistant Professor',
          departmentId: itDept.id,
          departmentName: 'Information Technology',
        },
      });
      console.log(`  ✓ Created FacultyProfile for Ashwini Rahude: profileId=${newProfile.id}, employeeId=FAC013`);
    }
  }

  // --- 7. Summary ---
  console.log('\n=== SUMMARY ===');
  const totalStudents = await prisma.studentProfile.count();
  const tyCount = await prisma.studentProfile.count({ where: { year: 'TY' } });
  const beCount = await prisma.studentProfile.count({ where: { year: 'BE' } });
  const totalEnrollments = await prisma.studentSubjectEnrollment.count();
  const tyEnrollments = await prisma.studentSubjectEnrollment.count({ where: { student: { year: 'TY' } } });
  const facultyProfiles = await prisma.facultyProfile.count();

  console.log(`Total StudentProfiles: ${totalStudents} (TY: ${tyCount}, BE: ${beCount})`);
  console.log(`Total Enrollments: ${totalEnrollments} (TY: ${tyEnrollments})`);
  console.log(`Faculty Profiles: ${facultyProfiles}`);

  await prisma.$disconnect();
  console.log('\n✓ Fix script completed successfully.');
}

run().catch(err => {
  console.error('Fix script failed:', err);
  process.exit(1);
});
