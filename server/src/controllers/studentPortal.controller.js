const prisma = require("../config/prisma");

const PROFILE_GENDERS = new Set(["Male", "Female", "Other", "Prefer not to say"]);
const PROFILE_BLOOD_GROUPS = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function divisionLetter(value) {
  const match = String(value || "").match(/\b([A-Z])\b/i);
  return match ? match[1].toUpperCase() : String(value || "").trim().toUpperCase();
}

function divisionVariants(value) {
  const letter = divisionLetter(value);
  return [...new Set([letter, `Div ${letter}`, `Division ${letter}`, `Section ${letter}`])];
}

function safeHttpsUrl(value, label = "File URL") {
  if (value == null || value === "") return null;
  let parsed;
  try { parsed = new URL(String(value)); } catch { fail(`${label} must be a valid HTTPS URL`); }
  if (parsed.protocol !== "https:") fail(`${label} must use HTTPS`);
  return parsed.toString();
}

async function getStudent(userId) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { user: { select: { status: true, isActive: true, role: true } } },
  });
  if (!student || student.user.role !== "STUDENT" || student.user.status !== "APPROVED" || !student.user.isActive) {
    fail("An approved active student profile is required", 403);
  }
  if (student.enrollmentStatus !== "ACTIVE") fail("Your student enrollment is not active", 403);
  return student;
}

function belongsToGroup(student, resource) {
  if (resource.academicYear !== student.academicYear || resource.year !== student.year) return false;
  if (resource.semester !== student.semester) return false;
  if (resource.division && divisionLetter(resource.division) !== divisionLetter(student.division)) return false;
  if (resource.labBatch && resource.labBatch !== student.labBatch) return false;
  return true;
}

function visibleToStudent(student, resource) {
  return belongsToGroup(student, resource);
}

function isValidDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function eventCanStudentSee(student, event) {
  return (!event.targetAcademicYear || event.targetAcademicYear === student.academicYear)
    && (!event.targetYear || event.targetYear === student.year)
    && (!event.targetDivision || divisionLetter(event.targetDivision) === divisionLetter(student.division))
    && (!event.targetLabBatch || event.targetLabBatch === student.labBatch);
}

exports.getTimetable = async (req, res, next) => {
  try {
    const student = await getStudent(req.user.id);
    const day = req.query.day == null ? undefined : Number(req.query.day);
    if (day !== undefined && (!Number.isInteger(day) || day < 1 || day > 7)) fail("day must be between 1 and 7");
    const enrollments = await prisma.studentSubjectEnrollment.findMany({
      where: { studentId: student.id, academicYear: student.academicYear, status: "ACTIVE" },
      select: { subjectId: true },
    });
    const subjectIds = enrollments.map((row) => row.subjectId);
    if (!subjectIds.length) return res.json({ success: true, days: {} });
    const entries = await prisma.timetableEntry.findMany({
      where: {
        academicYear: student.academicYear, year: student.year, semester: student.semester,
        division: { in: divisionVariants(student.division) },
        ...(day ? { dayOfWeek: day } : {}), subjectId: { in: subjectIds },
        OR: [{ labBatch: null }, ...(student.labBatch ? [{ labBatch: student.labBatch }] : [])],
      },
      include: {
        subject: { select: { id: true, subjectCode: true, subjectName: true } },
        faculty: { include: { user: { select: { name: true } } } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    const days = {};
    for (const entry of entries) {
      const dayName = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][entry.dayOfWeek];
      (days[dayName] ||= []).push({
        id: String(entry.id), dayOfWeek: entry.dayOfWeek, subject: entry.subject.subjectName,
        subjectCode: entry.subject.subjectCode, faculty: entry.faculty.user.name,
        startTime: entry.startTime, endTime: entry.endTime, time: `${entry.startTime} - ${entry.endTime}`,
        room: entry.room, type: entry.sessionType === "LAB" ? "Lab" : entry.sessionType === "TUTORIAL" ? "Tutorial" : "Lecture",
        division: entry.division, labBatch: entry.labBatch,
      });
    }
    return res.json({ success: true, days, entries });
  } catch (error) { next(error); }
};

function assignmentStudentStatus(assignment, submission) {
  if (submission) return submission.feedbackReleased ? "Evaluated" : "Submitted";
  return assignment.dueAt < new Date() ? "Overdue" : "Pending";
}

function mapAssignment(assignment, submission) {
  return {
    id: String(assignment.id), title: assignment.title,
    subject: assignment.subject.subjectName, subjectCode: assignment.subject.subjectCode,
    faculty: assignment.faculty.user.name, assignedDate: assignment.publishedAt,
    dueDate: assignment.dueAt, status: assignmentStudentStatus(assignment, submission),
    description: assignment.description, instructions: assignment.description,
    attachmentUrl: assignment.attachmentUrl, attachmentName: assignment.attachmentName,
    marks: submission?.feedbackReleased ? submission.marks : null,
    feedback: submission?.feedbackReleased ? submission.feedback : null,
    submission: submission ? {
      id: String(submission.id), responseText: submission.responseText,
      attachmentUrl: submission.attachmentUrl, attachmentName: submission.attachmentName,
      submittedAt: submission.submittedAt, feedbackReleased: submission.feedbackReleased,
      marks: submission.feedbackReleased ? submission.marks : null,
      feedback: submission.feedbackReleased ? submission.feedback : null,
    } : null,
  };
}

exports.getAssignments = async (req, res, next) => {
  try {
    const student = await getStudent(req.user.id);
    const enrollments = await prisma.studentSubjectEnrollment.findMany({
      where: { studentId: student.id, academicYear: student.academicYear, status: "ACTIVE" },
      select: { subjectId: true },
    });
    const assignments = enrollments.length ? await prisma.academicAssignment.findMany({
      where: {
        subjectId: { in: enrollments.map((e) => e.subjectId) },
        academicYear: student.academicYear, year: student.year, semester: student.semester,
        status: "PUBLISHED",
        OR: [
          { division: null },
          { division: { in: divisionVariants(student.division) }, OR: [{ labBatch: null }, ...(student.labBatch ? [{ labBatch: student.labBatch }] : [])] },
        ],
      },
      include: {
        subject: { select: { subjectCode: true, subjectName: true } },
        faculty: { include: { user: { select: { name: true } } } },
        submissions: { where: { studentId: student.id } },
      },
      orderBy: { dueAt: "asc" },
    }) : [];
    return res.json({ success: true, data: { assignments: assignments.map((a) => mapAssignment(a, a.submissions[0])) } });
  } catch (error) { next(error); }
};

exports.getAssignment = async (req, res, next) => {
  try {
    const student = await getStudent(req.user.id);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) fail("A valid assignment is required");
    const assignment = await prisma.academicAssignment.findUnique({
      where: { id },
      include: { subject: true, faculty: { include: { user: { select: { name: true } } } }, submissions: { where: { studentId: student.id } } },
    });
    const enrolled = assignment && await prisma.studentSubjectEnrollment.findFirst({
      where: { studentId: student.id, subjectId: assignment.subjectId, academicYear: assignment.academicYear, status: "ACTIVE" },
    });
    if (!assignment || assignment.status !== "PUBLISHED" || !enrolled || !visibleToStudent(student, assignment)) fail("Assignment not found", 404);
    return res.json({ success: true, data: { assignment: mapAssignment(assignment, assignment.submissions[0]) } });
  } catch (error) { next(error); }
};

exports.submitAssignment = async (req, res, next) => {
  try {
    const student = await getStudent(req.user.id);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) fail("A valid assignment is required");
    const assignment = await prisma.academicAssignment.findUnique({ where: { id } });
    if (!assignment || assignment.status !== "PUBLISHED" || !visibleToStudent(student, assignment)) fail("Assignment not found", 404);
    const enrollment = await prisma.studentSubjectEnrollment.findFirst({
      where: { studentId: student.id, subjectId: assignment.subjectId, academicYear: assignment.academicYear, status: "ACTIVE" },
    });
    if (!enrollment) fail("You are not enrolled in this subject", 403);
    if (new Date() > assignment.dueAt) fail("The assignment deadline has passed", 409);
    const responseText = String(req.body?.responseText || "").trim();
    const attachmentUrl = safeHttpsUrl(req.body?.attachmentUrl, "Submission attachment URL");
    if (!responseText && !attachmentUrl) fail("Enter a response or attach a document URL");
    const existing = await prisma.assignmentSubmission.findUnique({ where: { assignmentId_studentId: { assignmentId: id, studentId: student.id } } });
    if (existing && !assignment.allowResubmission) fail("A submission already exists for this assignment", 409);
    const submission = existing
      ? await prisma.assignmentSubmission.update({
          where: { id: existing.id },
          data: { responseText: responseText || null, attachmentUrl, attachmentName: req.body?.attachmentName || null, submittedAt: new Date(), marks: null, feedback: null, feedbackReleased: false },
        })
      : await prisma.assignmentSubmission.create({
          data: { assignmentId: id, studentId: student.id, responseText: responseText || null, attachmentUrl, attachmentName: req.body?.attachmentName || null },
        });
    return res.status(existing ? 200 : 201).json({ success: true, submission });
  } catch (error) { next(error); }
};

exports.getStudyPlans = async (req, res, next) => {
  try {
    const student = await getStudent(req.user.id);
    const enrollments = await prisma.studentSubjectEnrollment.findMany({
      where: { studentId: student.id, academicYear: student.academicYear, status: "ACTIVE" },
      select: { subjectId: true },
    });
    const plans = enrollments.length ? await prisma.studyPlan.findMany({
      where: {
        subjectId: { in: enrollments.map((e) => e.subjectId) }, academicYear: student.academicYear,
        year: student.year, semester: student.semester, status: "PUBLISHED",
        OR: [{ division: null }, { division: { in: divisionVariants(student.division) } }],
      },
      include: { subject: { select: { subjectCode: true, subjectName: true } }, faculty: { include: { user: { select: { name: true } } } } },
      orderBy: [{ subjectId: "asc" }, { version: "desc" }],
    }) : [];
    const seenSubjectIds = new Set();
    const latest = plans.filter((plan) => {
      if (seenSubjectIds.has(plan.subjectId)) return false;
      seenSubjectIds.add(plan.subjectId);
      return true;
    });
    return res.json({ success: true, data: { studyPlans: latest.map((p) => ({
      id: String(p.id), subject: p.subject.subjectName, subjectCode: p.subject.subjectCode,
      faculty: p.faculty.user.name, semester: `Semester ${p.semester}`, uploadedDate: p.publishedAt,
      fileName: p.fileName, fileUrl: p.fileUrl, title: p.title, description: p.description, version: p.version,
    })) } });
  } catch (error) { next(error); }
};

exports.getLeaveRequests = async (req, res, next) => {
  try {
    const student = await getStudent(req.user.id);
    const requests = await prisma.leaveRequest.findMany({
      where: { studentId: student.id }, include: { reviews: { orderBy: { createdAt: "asc" }, include: { reviewer: { select: { name: true, role: true } } } } },
      orderBy: { submittedAt: "desc" },
    });
    return res.json({ success: true, data: { requests: requests.map((r) => ({
      id: String(r.id), type: r.leaveType, startDate: r.startDate, endDate: r.endDate,
      appliedDate: r.submittedAt, reason: r.reason, status: r.status,
      reviewerRemarks: r.reviews.map((review) => ({ action: review.action, remarks: review.remarks, reviewer: review.reviewer.name, createdAt: review.createdAt })),
    })) } });
  } catch (error) { next(error); }
};

exports.createLeaveRequest = async (req, res, next) => {
  try {
    const student = await getStudent(req.user.id);
    const leaveType = String(req.body?.type || req.body?.leaveType || "").trim();
    const startDate = isValidDate(req.body?.startDate);
    const endDate = isValidDate(req.body?.endDate);
    const reason = String(req.body?.reason || "").trim();
    if (!leaveType || leaveType.length > 80) fail("A valid leave type is required");
    if (!startDate || !endDate || endDate < startDate) fail("Select a valid start and end date");
    if (!reason || reason.length > 4000) fail("A reason of up to 4000 characters is required");
    const clientRequestId = req.body?.clientRequestId ? String(req.body.clientRequestId).slice(0, 80) : null;
    const attachmentUrl = safeHttpsUrl(req.body?.attachmentUrl, "Supporting document URL");
    const existing = clientRequestId ? await prisma.leaveRequest.findUnique({ where: { studentId_clientRequestId: { studentId: student.id, clientRequestId } } }) : null;
    const request = existing || await prisma.leaveRequest.create({
      data: { studentId: student.id, leaveType, startDate, endDate, reason, attachmentUrl, clientRequestId },
    });
    return res.status(existing ? 200 : 201).json({ success: true, request: {
      id: String(request.id), type: request.leaveType, startDate: request.startDate,
      endDate: request.endDate, appliedDate: request.submittedAt, reason: request.reason, status: request.status,
    } });
  } catch (error) { next(error); }
};

exports.getEvents = async (req, res, next) => {
  try {
    const student = await getStudent(req.user.id);
    const events = await prisma.campusEvent.findMany({
      where: { status: "PUBLISHED" },
      include: { _count: { select: { registrations: { where: { status: "REGISTERED" } } } }, registrations: { where: { studentId: student.id }, select: { status: true } } },
      orderBy: { startsAt: "asc" },
    });
    const visible = events.filter((event) => eventCanStudentSee(student, event));
    const mapped = visible.map((event) => ({
      id: String(event.id), name: event.name, description: event.description || "",
      committee: event.organizer || "", organizer: event.organizer, venue: event.venue || "",
      date: event.startsAt, startDate: event.startsAt, endDate: event.endsAt || event.startsAt,
      time: new Date(event.startsAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      participants: event._count.registrations, capacity: event.capacity,
      registrationDeadline: event.registrationDeadline, status: event.startsAt < new Date() ? "Completed" : "Upcoming",
      category: event.category || "Academic", isRegistered: event.registrations[0]?.status === "REGISTERED",
      allowCancellation: event.allowCancellation,
      canCancel: event.registrations[0]?.status === "REGISTERED" && event.allowCancellation && (!event.cancellationDeadline || event.cancellationDeadline >= new Date()),
      canRegister: event.status === "PUBLISHED" && (!event.registrationOpensAt || event.registrationOpensAt <= new Date()) && (!event.registrationDeadline || event.registrationDeadline >= new Date()) && (!event.capacity || event._count.registrations < event.capacity),
    }));
    return res.json({ success: true, data: { events: mapped } });
  } catch (error) { next(error); }
};

exports.registerForEvent = async (req, res, next) => {
  try {
    const student = await getStudent(req.user.id);
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId)) fail("A valid event is required");
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "CampusEvent" WHERE "id" = ${eventId} FOR UPDATE`;
      const event = await tx.campusEvent.findUnique({ where: { id: eventId } });
      if (!event || event.status !== "PUBLISHED" || !eventCanStudentSee(student, event)) fail("Event not found", 404);
      const now = new Date();
      if (event.registrationOpensAt && now < event.registrationOpensAt) fail("Registration has not opened", 409);
      if (event.registrationDeadline && now > event.registrationDeadline) fail("Registration is closed", 409);
      const old = await tx.eventRegistration.findUnique({ where: { eventId_studentId: { eventId, studentId: student.id } } });
      if (old?.status === "REGISTERED") return { registration: old, alreadyRegistered: true };
      const activeCount = await tx.eventRegistration.count({ where: { eventId, status: "REGISTERED" } });
      if (event.capacity && activeCount >= event.capacity) fail("This event has reached its registration capacity", 409);
      const registration = old
        ? await tx.eventRegistration.update({ where: { id: old.id }, data: { status: "REGISTERED", registeredAt: now, cancelledAt: null } })
        : await tx.eventRegistration.create({ data: { eventId, studentId: student.id } });
      await require("../services/studentNotification.service").createStudentNotification(tx, {
        recipientId: req.user.id, type: "Events", title: "Event registration confirmed",
        body: `Your registration for ${event.name} is confirmed.`, dedupeKey: `event-registration:${eventId}`,
        relatedUrl: "/(main)/events",
      });
      return { registration, alreadyRegistered: false };
    }, { isolationLevel: "Serializable" });
    return res.status(result.alreadyRegistered ? 200 : 201).json({ success: true, alreadyRegistered: result.alreadyRegistered, registration: result.registration });
  } catch (error) { next(error); }
};

exports.cancelEventRegistration = async (req, res, next) => {
  try {
    const student = await getStudent(req.user.id);
    const eventId = Number(req.params.id);
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.campusEvent.findUnique({ where: { id: eventId } });
      if (!event) fail("Event not found", 404);
      if (!event.allowCancellation || (event.cancellationDeadline && new Date() > event.cancellationDeadline)) fail("This event registration can no longer be cancelled", 409);
      return tx.eventRegistration.updateMany({
        where: { eventId, studentId: student.id, status: "REGISTERED" },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
    });
    return res.json({ success: true, cancelled: result.count === 1 });
  } catch (error) { next(error); }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.studentNotification.findMany({ where: { recipientId: req.user.id }, orderBy: { createdAt: "desc" }, take: 100 });
    return res.json({ success: true, unreadCount: notifications.filter((n) => !n.readAt).length, data: { notifications: notifications.map((n) => ({
      id: n.id, type: n.type, title: n.title, description: n.body, timestamp: n.createdAt,
      read: Boolean(n.readAt), relatedUrl: n.relatedUrl,
    })) } });
  } catch (error) { next(error); }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const result = await prisma.studentNotification.updateMany({
      where: { id: req.params.id, recipientId: req.user.id, readAt: null }, data: { readAt: new Date() },
    });
    if (!result.count) {
      const exists = await prisma.studentNotification.findFirst({ where: { id: req.params.id, recipientId: req.user.id }, select: { id: true } });
      if (!exists) fail("Notification not found", 404);
    }
    return res.json({ success: true, read: true });
  } catch (error) { next(error); }
};

exports.getDocuments = async (req, res, next) => {
  try {
    const student = await getStudent(req.user.id);
    const documents = await prisma.studentDocument.findMany({ where: { studentId: student.id }, orderBy: { submittedAt: "desc" } });
    return res.json({ success: true, data: { documents: documents.map((d) => ({
      id: String(d.id), title: d.title, type: d.documentType, fileName: d.fileName,
      fileUrl: d.fileUrl, status: d.status, submittedAt: d.submittedAt,
      reviewerRemarks: d.reviewerRemarks,
    })) } });
  } catch (error) { next(error); }
};

exports.getFees = async (req, res, next) => {
  try {
    const student = await getStudent(req.user.id);
    const [charges, payments] = await Promise.all([
      prisma.studentFeeCharge.findMany({ where: { studentId: student.id }, orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] }),
      prisma.studentFeePayment.findMany({ where: { studentId: student.id, status: "RECORDED" }, orderBy: { paidAt: "desc" } }),
    ]);
    const totalFee = charges.reduce((sum, row) => sum + Number(row.amount), 0);
    const paidAmount = payments.reduce((sum, row) => sum + Number(row.amount), 0);
    const dueDate = charges.map((row) => row.dueDate).filter(Boolean).sort((a, b) => a - b)[0] || null;
    const pendingAmount = Math.max(0, totalFee - paidAmount);
    return res.json({ success: true, data: {
      totalFee, paidAmount, pendingAmount, dueDate,
      status: totalFee === 0 ? "UNAVAILABLE" : pendingAmount === 0 ? "PAID" : paidAmount ? "PARTIAL" : "PENDING",
      charges: charges.map((c) => ({ id: c.id, title: c.title, academicYear: c.academicYear, amount: Number(c.amount), dueDate: c.dueDate })),
      transactions: payments.map((p) => ({ id: String(p.id), receiptNo: p.receiptNumber, date: p.paidAt, amount: Number(p.amount), mode: p.paymentMethod, status: p.status, receiptUrl: p.receiptUrl })),
      paymentProcessingAvailable: false,
    } });
  } catch (error) { next(error); }
};

exports.getLibrary = async (req, res, next) => {
  try {
    const student = await getStudent(req.user.id);
    const [books, loans, policy] = await Promise.all([
      prisma.libraryBook.findMany({ orderBy: { title: "asc" }, take: 200 }),
      prisma.libraryLoan.findMany({ where: { studentId: student.id }, include: { book: true }, orderBy: { issuedAt: "desc" } }),
      prisma.libraryPolicy.findUnique({ where: { id: 1 } }),
    ]);
    const activeCounts = await prisma.libraryLoan.groupBy({ by: ["bookId"], where: { returnedAt: null }, _count: { _all: true } });
    const countByBook = new Map(activeCounts.map((row) => [row.bookId, row._count._all]));
    const now = Date.now();
    const mappedLoans = loans.map((loan) => {
      const overdueDays = loan.returnedAt ? 0 : Math.max(0, Math.ceil((now - loan.dueAt.getTime()) / 86400000));
      const fine = policy?.finePerDay == null ? null : overdueDays * Number(policy.finePerDay);
      return { id: String(loan.id), bookId: loan.bookId, title: loan.book.title, author: loan.book.author,
        accessionNo: loan.book.accessionCode, issueDate: loan.issuedAt, dueDate: loan.dueAt,
        returnedAt: loan.returnedAt, status: loan.returnedAt ? "RETURNED" : overdueDays ? "OVERDUE" : "ACTIVE", fineAmount: fine };
    });
    return res.json({ success: true, data: {
      issuedBooksCount: mappedLoans.filter((loan) => loan.status !== "RETURNED").length,
      maxAllowed: policy?.maxActiveLoans ?? null,
      fineAmount: mappedLoans.reduce((sum, loan) => sum + (loan.fineAmount || 0), 0),
      finePolicyConfigured: policy?.finePerDay != null,
      books: books.map((book) => ({ ...book, availableCopies: Math.max(0, book.totalCopies - (countByBook.get(book.id) || 0)) })),
      loans: mappedLoans,
    } });
  } catch (error) { next(error); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const forbidden = ["id", "studentId", "rollNo", "enrollmentNo", "departmentId", "departmentCode", "departmentName", "academicYear", "semester", "division", "labBatch", "year", "enrollmentStatus", "role", "status", "approvalStatus", "isActive", "email"];
    const keys = Object.keys(req.body || {});
    const blocked = keys.filter((key) => forbidden.includes(key));
    if (blocked.length) fail(`These profile fields are managed by authorized staff: ${blocked.join(", ")}`);
    const student = await getStudent(req.user.id);
    const profileFields = ["mobileNumber", "gender", "bloodGroup", "nationality", "fatherName", "motherName", "address", "emergencyContactName", "emergencyContactRelationship", "emergencyContactPhone"];
    const profileData = {};
    for (const field of profileFields) if (Object.hasOwn(req.body || {}, field)) {
      const value = req.body[field];
      if (value !== null && typeof value !== "string") fail(`${field} must be text`);
      if (typeof value === "string" && value.length > 300) fail(`${field} is too long`);
      const normalized = typeof value === "string" ? value.trim() : null;
      if (field === "gender" && normalized && !PROFILE_GENDERS.has(normalized)) {
        fail(`gender must be one of: ${[...PROFILE_GENDERS].join(", ")}`);
      }
      if (field === "bloodGroup" && normalized && !PROFILE_BLOOD_GROUPS.has(normalized)) {
        fail(`bloodGroup must be one of: ${[...PROFILE_BLOOD_GROUPS].join(", ")}`);
      }
      profileData[field] = normalized || null;
    }
    if (Object.hasOwn(req.body || {}, "dateOfBirth")) {
      if (req.body.dateOfBirth === null || req.body.dateOfBirth === "") profileData.dateOfBirth = null;
      else {
        const date = isValidDate(req.body.dateOfBirth);
        if (!date) fail("Enter a valid date of birth");
        profileData.dateOfBirth = date;
      }
    }
    const userData = {};
    if (Object.hasOwn(req.body || {}, "name")) {
      const name = String(req.body.name || "").trim();
      if (!name || name.length > 120) fail("Enter a valid name");
      userData.name = name;
    }
    const [updated, user] = await prisma.$transaction([
      prisma.studentProfile.update({ where: { id: student.id }, data: profileData }),
      ...(Object.keys(userData).length ? [prisma.user.update({ where: { id: req.user.id }, data: userData, select: { name: true } })] : []),
    ]).then((rows) => [rows[0], rows[1] || null]);
    return res.json({ success: true, profile: { ...updated, name: user?.name || undefined } });
  } catch (error) { next(error); }
};

