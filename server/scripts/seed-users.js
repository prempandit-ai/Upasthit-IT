require("dotenv").config();

const prisma = require("../src/config/prisma");
const { hashPassword } = require("../src/utils/hashPassword");

async function seed() {
  console.log("🌱 Starting ERP Database Seeding...\n");

  // 1. Seed Departments
  console.log("🏫 Seeding Departments...");
  const departments = [
    { code: "IT", name: "Information Technology" },
    { code: "CE", name: "Computer Engineering" },
    { code: "AIDS", name: "Artificial Intelligence & Data Science" },
    { code: "ME", name: "Mechanical Engineering" },
  ];

  const deptMap = {};
  for (const dept of departments) {
    const record = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name },
      create: { code: dept.code, name: dept.name },
    });
    deptMap[dept.code] = record;
    console.log(`  ✓ Department [${record.code}] ${record.name}`);
  }

  const defaultPassword = await hashPassword("Password123");

  // 2. Seed Admin
  console.log("\n👤 Seeding System Admin...");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@upasthit.test" },
    update: {
      name: "System Administrator",
      password: defaultPassword,
      role: "ADMIN",
      status: "APPROVED",
      isActive: true,
    },
    create: {
      name: "System Administrator",
      email: "admin@upasthit.test",
      password: defaultPassword,
      role: "ADMIN",
      status: "APPROVED",
      isActive: true,
    },
  });

  await prisma.adminProfile.upsert({
    where: { userId: adminUser.id },
    update: { employeeId: "EMP-ADM-001" },
    create: {
      userId: adminUser.id,
      employeeId: "EMP-ADM-001",
    },
  });
  console.log(`  ✓ Admin: ${adminUser.email} (EMP-ADM-001)`);

  // 3. Seed HOD
  console.log("\n👤 Seeding HOD...");
  const hodUser = await prisma.user.upsert({
    where: { email: "hod@upasthit.test" },
    update: {
      name: "Dr. Rajesh Sharma (HOD)",
      password: defaultPassword,
      role: "HOD",
      status: "APPROVED",
      isActive: true,
    },
    create: {
      name: "Dr. Rajesh Sharma (HOD)",
      email: "hod@upasthit.test",
      password: defaultPassword,
      role: "HOD",
      status: "APPROVED",
      isActive: true,
    },
  });

  await prisma.hODProfile.upsert({
    where: { userId: hodUser.id },
    update: {
      employeeId: "EMP-HOD-IT01",
      departmentId: deptMap["IT"].id,
      departmentName: deptMap["IT"].name,
    },
    create: {
      userId: hodUser.id,
      employeeId: "EMP-HOD-IT01",
      departmentId: deptMap["IT"].id,
      departmentName: deptMap["IT"].name,
    },
  });
  console.log(`  ✓ HOD: ${hodUser.email} (EMP-HOD-IT01 - IT)`);

  // 4. Seed Coordinator
  console.log("\n👤 Seeding Coordinator...");
  const coordUser = await prisma.user.upsert({
    where: { email: "coordinator@upasthit.test" },
    update: {
      name: "Prof. Sunita Patil",
      password: defaultPassword,
      role: "COORDINATOR",
      status: "APPROVED",
      isActive: true,
    },
    create: {
      name: "Prof. Sunita Patil",
      email: "coordinator@upasthit.test",
      password: defaultPassword,
      role: "COORDINATOR",
      status: "APPROVED",
      isActive: true,
    },
  });

  await prisma.coordinatorProfile.upsert({
    where: { userId: coordUser.id },
    update: {
      employeeId: "EMP-CRD-IT01",
      departmentId: deptMap["IT"].id,
      departmentName: deptMap["IT"].name,
    },
    create: {
      userId: coordUser.id,
      employeeId: "EMP-CRD-IT01",
      departmentId: deptMap["IT"].id,
      departmentName: deptMap["IT"].name,
    },
  });
  console.log(`  ✓ Coordinator: ${coordUser.email} (EMP-CRD-IT01 - IT)`);

  // 5. Seed Faculty
  console.log("\n👤 Seeding Faculty...");
  const facultyUser = await prisma.user.upsert({
    where: { email: "faculty@upasthit.test" },
    update: {
      name: "Prof. Amit Verma",
      password: defaultPassword,
      role: "FACULTY",
      status: "APPROVED",
      isActive: true,
    },
    create: {
      name: "Prof. Amit Verma",
      email: "faculty@upasthit.test",
      password: defaultPassword,
      role: "FACULTY",
      status: "APPROVED",
      isActive: true,
    },
  });

  const facultyProf = await prisma.facultyProfile.upsert({
    where: { userId: facultyUser.id },
    update: {
      employeeId: "EMP-FAC-IT01",
      designation: "Assistant Professor",
      mobileNumber: "9876543210",
      departmentId: deptMap["IT"].id,
      departmentName: deptMap["IT"].name,
    },
    create: {
      userId: facultyUser.id,
      employeeId: "EMP-FAC-IT01",
      designation: "Assistant Professor",
      mobileNumber: "9876543210",
      departmentId: deptMap["IT"].id,
      departmentName: deptMap["IT"].name,
    },
  });
  console.log(`  ✓ Faculty: ${facultyUser.email} (EMP-FAC-IT01 - IT)`);

  // 6. Seed Student
  console.log("\n👤 Seeding Student...");
  const studentUser = await prisma.user.upsert({
    where: { email: "student@upasthit.test" },
    update: {
      name: "Aarav Patel",
      password: defaultPassword,
      role: "STUDENT",
      status: "APPROVED",
      isActive: true,
    },
    create: {
      name: "Aarav Patel",
      email: "student@upasthit.test",
      password: defaultPassword,
      role: "STUDENT",
      status: "APPROVED",
      isActive: true,
    },
  });

  const studentProf = await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {
      studentId: "GR2025001",
      rollNo: 1,
      enrollmentNo: "EN20250001",
      mobileNumber: "9123456780",
      gender: "Male",
      enrollmentStatus: "ACTIVE",
      departmentId: deptMap["IT"].id,
      departmentCode: "IT",
      departmentName: "Information Technology",
      academicYear: "2025-26",
      semester: 6,
      division: "A",
      year: "TY",
    },
    create: {
      userId: studentUser.id,
      studentId: "GR2025001",
      rollNo: 1,
      enrollmentNo: "EN20250001",
      mobileNumber: "9123456780",
      gender: "Male",
      enrollmentStatus: "ACTIVE",
      departmentId: deptMap["IT"].id,
      departmentCode: "IT",
      departmentName: "Information Technology",
      academicYear: "2025-26",
      semester: 6,
      division: "A",
      year: "TY",
    },
  });
  console.log(`  ✓ Student: ${studentUser.email} (GR2025001 / Roll 1 - TY IT Div A)`);

  // 7. Seed Subjects
  console.log("\n📚 Seeding Subjects...");
  const subjectsData = [
    {
      subjectCode: "IT601",
      subjectName: "Database Management Systems",
      subjectType: "THEORY",
      credits: 4,
      departmentId: deptMap["IT"].id,
      departmentCode: "IT",
      academicYear: "2025-26",
      semester: 6,
      year: "TY",
    },
    {
      subjectCode: "IT602",
      subjectName: "Computer Networks & Security",
      subjectType: "THEORY",
      credits: 4,
      departmentId: deptMap["IT"].id,
      departmentCode: "IT",
      academicYear: "2025-26",
      semester: 6,
      year: "TY",
    },
    {
      subjectCode: "IT603",
      subjectName: "Software Engineering & Agile",
      subjectType: "THEORY",
      credits: 3,
      departmentId: deptMap["IT"].id,
      departmentCode: "IT",
      academicYear: "2025-26",
      semester: 6,
      year: "TY",
    },
    {
      subjectCode: "IT604",
      subjectName: "DBMS Laboratory",
      subjectType: "PRACTICAL",
      credits: 2,
      departmentId: deptMap["IT"].id,
      departmentCode: "IT",
      academicYear: "2025-26",
      semester: 6,
      year: "TY",
    },
  ];

  const subjectMap = {};
  for (const s of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { subjectCode: s.subjectCode },
      update: s,
      create: s,
    });
    subjectMap[s.subjectCode] = subject;
    console.log(`  ✓ Subject [${subject.subjectCode}] ${subject.subjectName} (${subject.subjectType}, Sem ${subject.semester})`);
  }

  // 8. Assign Faculty to Subjects
  console.log("\n👨‍🏫 Assigning Faculty to Subjects...");
  for (const code of ["IT601", "IT604"]) {
    await prisma.facultySubjectAssignment.upsert({
      where: {
        facultyId_subjectId_academicYear_division: {
          facultyId: facultyProf.id,
          subjectId: subjectMap[code].id,
          academicYear: "2025-26",
          division: "A",
        },
      },
      update: {},
      create: {
        facultyId: facultyProf.id,
        subjectId: subjectMap[code].id,
        academicYear: "2025-26",
        division: "A",
      },
    });
    console.log(`  ✓ Assigned Prof. Amit Verma -> [${code}] (TY Div A)`);
  }

  // 9. Enroll Student in Subjects
  console.log("\n🎓 Enrolling Student in Subjects...");
  for (const code of ["IT601", "IT602", "IT603", "IT604"]) {
    await prisma.studentSubjectEnrollment.upsert({
      where: {
        studentId_subjectId_academicYear: {
          studentId: studentProf.id,
          subjectId: subjectMap[code].id,
          academicYear: "2025-26",
        },
      },
      update: { status: "ACTIVE" },
      create: {
        studentId: studentProf.id,
        subjectId: subjectMap[code].id,
        academicYear: "2025-26",
        status: "ACTIVE",
      },
    });
    console.log(`  ✓ Enrolled Aarav Patel in [${code}]`);
  }

  console.log("\n✨ Seeding completed successfully!");
}

seed()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
