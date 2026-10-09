-- ─── Attendance Module Migration ─────────────────────────────────────────────
-- Migration: add_attendance_module
-- This migration adds the attendance tracking module to the Upasthit ERP.
-- All attendance tables already exist in the database (applied via db push).
-- This file documents what was applied for migration history consistency.

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "AttendanceSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add gender column to StudentProfile (if not exists)
DO $$ BEGIN
    ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "gender" TEXT;
EXCEPTION
    WHEN others THEN null;
END $$;

-- CreateTable AttendanceSession (if not exists)
CREATE TABLE IF NOT EXISTS "AttendanceSession" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "year" "Year" NOT NULL,
    "division" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable AttendanceRecord (if not exists)
CREATE TABLE IF NOT EXISTS "AttendanceRecord" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "AttendanceSession_assignmentId_sessionDate_idx" ON "AttendanceSession"("assignmentId", "sessionDate");

-- CreateUniqueIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceRecord_sessionId_studentId_key" ON "AttendanceRecord"("sessionId", "studentId");

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "AttendanceRecord_studentId_idx" ON "AttendanceRecord"("studentId");

-- AddForeignKey (idempotent via DO block)
DO $$ BEGIN
    ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_assignmentId_fkey"
        FOREIGN KEY ("assignmentId") REFERENCES "FacultySubjectAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey"
        FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey"
        FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
