-- Additive student portal tables only. Existing records and tables are untouched.
CREATE TYPE "TimetableSessionType" AS ENUM ('LECTURE', 'LAB', 'TUTORIAL');
CREATE TYPE "AcademicAssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "StudyPlanStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SENT_BACK');
CREATE TYPE "CampusEventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');
CREATE TYPE "EventRegistrationStatus" AS ENUM ('REGISTERED', 'CANCELLED');
CREATE TYPE "StudentDocumentStatus" AS ENUM ('SUBMITTED', 'VERIFIED', 'REJECTED');
CREATE TYPE "FeePaymentStatus" AS ENUM ('RECORDED', 'VOID');

CREATE TABLE "TimetableEntry" (
  "id" SERIAL NOT NULL,
  "academicYear" TEXT NOT NULL,
  "year" "Year" NOT NULL,
  "semester" INTEGER NOT NULL,
  "division" TEXT NOT NULL,
  "labBatch" TEXT,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "room" TEXT,
  "sessionType" "TimetableSessionType" NOT NULL,
  "subjectId" INTEGER NOT NULL,
  "facultyId" INTEGER NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TimetableEntry_dayOfWeek_check" CHECK ("dayOfWeek" BETWEEN 1 AND 7),
  CONSTRAINT "TimetableEntry_labBatch_check" CHECK (("sessionType" = 'LAB' AND "labBatch" IS NOT NULL) OR ("sessionType" <> 'LAB')),
  CONSTRAINT "TimetableEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TimetableEntry_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TimetableEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "TimetableEntry_academicYear_year_semester_division_dayOfWeek_idx" ON "TimetableEntry"("academicYear", "year", "semester", "division", "dayOfWeek");
CREATE INDEX "TimetableEntry_facultyId_dayOfWeek_idx" ON "TimetableEntry"("facultyId", "dayOfWeek");

CREATE TABLE "AcademicAssignment" (
  "id" SERIAL NOT NULL,
  "subjectId" INTEGER NOT NULL,
  "facultyId" INTEGER NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  "year" "Year" NOT NULL,
  "semester" INTEGER NOT NULL,
  "division" TEXT,
  "labBatch" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "attachmentUrl" TEXT,
  "attachmentName" TEXT,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "maxMarks" DECIMAL(8,2),
  "status" "AcademicAssignmentStatus" NOT NULL DEFAULT 'DRAFT',
  "allowResubmission" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AcademicAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AcademicAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AcademicAssignment_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AcademicAssignment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AcademicAssignment_maxMarks_check" CHECK ("maxMarks" IS NULL OR "maxMarks" >= 0)
);
CREATE INDEX "AcademicAssignment_facultyId_status_dueAt_idx" ON "AcademicAssignment"("facultyId", "status", "dueAt");
CREATE INDEX "AcademicAssignment_academicYear_year_semester_division_labBatch_status_idx" ON "AcademicAssignment"("academicYear", "year", "semester", "division", "labBatch", "status");

CREATE TABLE "AssignmentSubmission" (
  "id" SERIAL NOT NULL,
  "assignmentId" INTEGER NOT NULL,
  "studentId" INTEGER NOT NULL,
  "responseText" TEXT,
  "attachmentUrl" TEXT,
  "attachmentName" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "marks" DECIMAL(8,2),
  "feedback" TEXT,
  "feedbackReleased" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "AcademicAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AssignmentSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AssignmentSubmission_marks_check" CHECK ("marks" IS NULL OR "marks" >= 0)
);
CREATE UNIQUE INDEX "AssignmentSubmission_assignmentId_studentId_key" ON "AssignmentSubmission"("assignmentId", "studentId");
CREATE INDEX "AssignmentSubmission_studentId_submittedAt_idx" ON "AssignmentSubmission"("studentId", "submittedAt");

CREATE TABLE "StudyPlan" (
  "id" SERIAL NOT NULL,
  "subjectId" INTEGER NOT NULL,
  "facultyId" INTEGER NOT NULL,
  "academicYear" TEXT NOT NULL,
  "year" "Year" NOT NULL,
  "semester" INTEGER NOT NULL,
  "division" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "fileUrl" TEXT,
  "fileName" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "StudyPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudyPlan_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StudyPlan_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StudyPlan_version_check" CHECK ("version" > 0)
);
CREATE UNIQUE INDEX "StudyPlan_subjectId_academicYear_year_semester_version_key" ON "StudyPlan"("subjectId", "academicYear", "year", "semester", "version");
CREATE INDEX "StudyPlan_academicYear_year_semester_division_status_idx" ON "StudyPlan"("academicYear", "year", "semester", "division", "status");

CREATE TABLE "LeaveRequest" (
  "id" SERIAL NOT NULL,
  "studentId" INTEGER NOT NULL,
  "leaveType" TEXT NOT NULL,
  "clientRequestId" TEXT,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "reason" TEXT NOT NULL,
  "attachmentUrl" TEXT,
  "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LeaveRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LeaveRequest_dates_check" CHECK ("endDate" >= "startDate")
);
CREATE INDEX "LeaveRequest_studentId_submittedAt_idx" ON "LeaveRequest"("studentId", "submittedAt");
CREATE INDEX "LeaveRequest_status_submittedAt_idx" ON "LeaveRequest"("status", "submittedAt");
CREATE UNIQUE INDEX "LeaveRequest_studentId_clientRequestId_key" ON "LeaveRequest"("studentId", "clientRequestId");

CREATE TABLE "LeaveRequestReview" (
  "id" SERIAL NOT NULL,
  "leaveRequestId" INTEGER NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeaveRequestReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LeaveRequestReview_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LeaveRequestReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "LeaveRequestReview_leaveRequestId_createdAt_idx" ON "LeaveRequestReview"("leaveRequestId", "createdAt");

CREATE TABLE "CampusEvent" (
  "id" SERIAL NOT NULL,
  "createdById" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "description" TEXT,
  "organizer" TEXT,
  "venue" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "registrationOpensAt" TIMESTAMP(3),
  "registrationDeadline" TIMESTAMP(3),
  "cancellationDeadline" TIMESTAMP(3),
  "capacity" INTEGER,
  "allowCancellation" BOOLEAN NOT NULL DEFAULT false,
  "targetAcademicYear" TEXT,
  "targetYear" "Year",
  "targetDivision" TEXT,
  "targetLabBatch" TEXT,
  "status" "CampusEventStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampusEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CampusEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CampusEvent_capacity_check" CHECK ("capacity" IS NULL OR "capacity" > 0),
  CONSTRAINT "CampusEvent_dates_check" CHECK ("endsAt" IS NULL OR "endsAt" >= "startsAt")
);
CREATE INDEX "CampusEvent_status_startsAt_idx" ON "CampusEvent"("status", "startsAt");
CREATE INDEX "CampusEvent_targetAcademicYear_targetYear_targetDivision_targetLabBatch_idx" ON "CampusEvent"("targetAcademicYear", "targetYear", "targetDivision", "targetLabBatch");

CREATE TABLE "EventRegistration" (
  "id" SERIAL NOT NULL,
  "eventId" INTEGER NOT NULL,
  "studentId" INTEGER NOT NULL,
  "status" "EventRegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
  "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CampusEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EventRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EventRegistration_eventId_studentId_key" ON "EventRegistration"("eventId", "studentId");
CREATE INDEX "EventRegistration_studentId_status_idx" ON "EventRegistration"("studentId", "status");

CREATE TABLE "EventFacultyAssignment" (
  "id" SERIAL NOT NULL,
  "eventId" INTEGER NOT NULL,
  "facultyId" INTEGER NOT NULL,
  "responsibility" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventFacultyAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EventFacultyAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CampusEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EventFacultyAssignment_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "FacultyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EventFacultyAssignment_eventId_facultyId_key" ON "EventFacultyAssignment"("eventId", "facultyId");
CREATE INDEX "EventFacultyAssignment_facultyId_idx" ON "EventFacultyAssignment"("facultyId");

CREATE TABLE "StudentNotification" (
  "id" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "relatedUrl" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentNotification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudentNotification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StudentNotification_recipientId_dedupeKey_key" ON "StudentNotification"("recipientId", "dedupeKey");
CREATE INDEX "StudentNotification_recipientId_readAt_createdAt_idx" ON "StudentNotification"("recipientId", "readAt", "createdAt");

CREATE TABLE "StudentDocument" (
  "id" SERIAL NOT NULL,
  "studentId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" BIGINT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "status" "StudentDocumentStatus" NOT NULL DEFAULT 'SUBMITTED',
  "reviewerId" TEXT,
  "reviewerRemarks" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "StudentDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudentDocument_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StudentDocument_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "StudentDocument_sizeBytes_check" CHECK ("sizeBytes" >= 0)
);
CREATE INDEX "StudentDocument_studentId_submittedAt_idx" ON "StudentDocument"("studentId", "submittedAt");

CREATE TABLE "StudentFeeCharge" (
  "id" SERIAL NOT NULL,
  "studentId" INTEGER NOT NULL,
  "createdById" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "dueDate" DATE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentFeeCharge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudentFeeCharge_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StudentFeeCharge_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StudentFeeCharge_amount_check" CHECK ("amount" >= 0)
);
CREATE INDEX "StudentFeeCharge_studentId_academicYear_dueDate_idx" ON "StudentFeeCharge"("studentId", "academicYear", "dueDate");

CREATE TABLE "StudentFeePayment" (
  "id" SERIAL NOT NULL,
  "studentId" INTEGER NOT NULL,
  "chargeId" INTEGER,
  "receiptNumber" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "paymentMethod" TEXT,
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "FeePaymentStatus" NOT NULL DEFAULT 'RECORDED',
  "receiptUrl" TEXT,
  CONSTRAINT "StudentFeePayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudentFeePayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StudentFeePayment_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "StudentFeeCharge"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "StudentFeePayment_amount_check" CHECK ("amount" >= 0)
);
CREATE UNIQUE INDEX "StudentFeePayment_receiptNumber_key" ON "StudentFeePayment"("receiptNumber");
CREATE INDEX "StudentFeePayment_studentId_paidAt_idx" ON "StudentFeePayment"("studentId", "paidAt");

CREATE TABLE "LibraryBook" (
  "id" SERIAL NOT NULL,
  "isbn" TEXT,
  "accessionCode" TEXT,
  "title" TEXT NOT NULL,
  "author" TEXT,
  "publisher" TEXT,
  "category" TEXT,
  "totalCopies" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LibraryBook_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LibraryBook_totalCopies_check" CHECK ("totalCopies" >= 0)
);
CREATE UNIQUE INDEX "LibraryBook_isbn_key" ON "LibraryBook"("isbn");
CREATE UNIQUE INDEX "LibraryBook_accessionCode_key" ON "LibraryBook"("accessionCode");
CREATE INDEX "LibraryBook_title_idx" ON "LibraryBook"("title");

CREATE TABLE "LibraryLoan" (
  "id" SERIAL NOT NULL,
  "bookId" INTEGER NOT NULL,
  "studentId" INTEGER NOT NULL,
  "issuedById" TEXT NOT NULL,
  "returnedToId" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "returnedAt" TIMESTAMP(3),
  CONSTRAINT "LibraryLoan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LibraryLoan_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "LibraryBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "LibraryLoan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LibraryLoan_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "LibraryLoan_returnedToId_fkey" FOREIGN KEY ("returnedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "LibraryLoan_dates_check" CHECK ("dueAt" >= "issuedAt")
);
CREATE INDEX "LibraryLoan_studentId_returnedAt_dueAt_idx" ON "LibraryLoan"("studentId", "returnedAt", "dueAt");
CREATE INDEX "LibraryLoan_bookId_returnedAt_idx" ON "LibraryLoan"("bookId", "returnedAt");

CREATE TABLE "LibraryPolicy" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "maxActiveLoans" INTEGER NOT NULL DEFAULT 0,
  "finePerDay" DECIMAL(8,2),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LibraryPolicy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LibraryPolicy_singleton_check" CHECK ("id" = 1),
  CONSTRAINT "LibraryPolicy_maxActiveLoans_check" CHECK ("maxActiveLoans" >= 0),
  CONSTRAINT "LibraryPolicy_finePerDay_check" CHECK ("finePerDay" IS NULL OR "finePerDay" >= 0)
);
