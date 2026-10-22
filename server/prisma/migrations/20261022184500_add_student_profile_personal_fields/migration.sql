-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN "program" TEXT,
ADD COLUMN "dateOfBirth" TIMESTAMP(3),
ADD COLUMN "bloodGroup" TEXT,
ADD COLUMN "nationality" TEXT,
ADD COLUMN "fatherName" TEXT,
ADD COLUMN "motherName" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "emergencyContactName" TEXT,
ADD COLUMN "emergencyContactRelationship" TEXT,
ADD COLUMN "emergencyContactPhone" TEXT;
