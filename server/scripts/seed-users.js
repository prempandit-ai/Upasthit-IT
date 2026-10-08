require("dotenv").config();

const prisma = require("../src/config/prisma");
const { hashPassword } = require("../src/utils/hashPassword");

const seedUsers = [
  {
    name: "System Admin",
    email: "admin@upasthit.test",
    password: "Password123",
    role: "ADMIN",
    status: "APPROVED",
  },
  {
    name: "Test Student",
    email: "student@upasthit.test",
    password: "Password123",
    role: "STUDENT",
    status: "APPROVED",
  },
  {
    name: "Test Faculty",
    email: "faculty@upasthit.test",
    password: "Password123",
    role: "FACULTY",
    status: "APPROVED",
  },
  {
    name: "Test HOD",
    email: "hod@upasthit.test",
    password: "Password123",
    role: "HOD",
    status: "APPROVED",
  },
  {
    name: "Test Coordinator",
    email: "coordinator@upasthit.test",
    password: "Password123",
    role: "COORDINATOR",
    status: "APPROVED",
  },
];

async function seed() {
  for (const user of seedUsers) {
    const hashedPassword = await hashPassword(user.password);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: hashedPassword,
        role: user.role,
        status: user.status,
        isActive: true,
      },
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        status: user.status,
      },
    });

    console.log(`Seeded ${user.role}: ${user.email}`);
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
