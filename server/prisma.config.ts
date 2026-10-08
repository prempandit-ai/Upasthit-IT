import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "./prisma/migrations",
  },
  datasource: {
    // Use direct (non-pooler) connection for migrations; runtime uses DATABASE_URL via adapter-pg
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});