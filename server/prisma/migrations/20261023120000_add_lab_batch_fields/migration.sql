-- Adds nullable batch metadata only. Existing student and attendance rows are preserved.
ALTER TABLE "StudentProfile" ADD COLUMN "labBatch" TEXT;
ALTER TABLE "AttendanceSession" ADD COLUMN "labBatch" TEXT;
