-- Attendance session lifecycle: NOT_STARTED → ACTIVE → COMPLETED
-- Adds expiry timestamps while preserving existing attendance records.

DO $$ BEGIN
    ALTER TYPE "AttendanceSessionStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "AttendanceSession"
    ADD COLUMN IF NOT EXISTS "attendanceType" TEXT,
    ADD COLUMN IF NOT EXISTS "sessionType" TEXT,
    ADD COLUMN IF NOT EXISTS "lectureTime" TEXT,
    ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "windowDurationSeconds" INTEGER NOT NULL DEFAULT 300,
    ADD COLUMN IF NOT EXISTS "joinCode" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceSession_joinCode_key" ON "AttendanceSession"("joinCode");
CREATE INDEX IF NOT EXISTS "AttendanceSession_status_expiresAt_idx" ON "AttendanceSession"("status", "expiresAt");
