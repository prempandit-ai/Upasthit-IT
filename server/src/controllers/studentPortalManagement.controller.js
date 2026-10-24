const prisma = require("../config/prisma");
const { createStudentNotification } = require("../services/studentNotification.service");

function fail(message, statusCode = 400) { const error = new Error(message); error.statusCode = statusCode; throw error; }
function divisionLetter(value) { const match = String(value || "").match(/\b([A-Z])\b/i); return match ? match[1].toUpperCase() : String(value || "").trim().toUpperCase(); }
function divisionVariants(value) { const d = divisionLetter(value); return [...new Set([d, `Div ${d}`, `Division ${d}`, `Section ${d}`])]; }
function validUrl(value) {
  if (!value) return null;
  let parsed;
  try { parsed = new URL(String(value)); } catch { fail("File URL must be valid HTTPS"); }
  if (parsed.protocol !== "https:") fail("File URL must use HTTPS");
  return parsed.toString();
}
function validYear(value) { return ["FY", "SY", "TY", "BE"].includes(value); }
function validLabBatch(batch, division) { return !batch || ((divisionLetter(division) === "A" && /^A[1-3]$/.test(batch)) || (divisionLetter(division) === "B" && /^B[1-3]$/.test(batch))); }
function parseDate(value, label) { const date = new Date(value); if (!value || !Number.isFinite(date.getTime())) fail(`${label} must be a valid date`); return date; }
function parseDateTime(dateValue, timeValue, label) {
  const date = parseDate(dateValue, label);
  if (typeof timeValue === "string" && timeValue.trim()) {
    const match = timeValue.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let hour = Number(match[1]) % 12;
      if (match[3].toUpperCase() === "PM") hour += 12;
      date.setHours(hour, Number(match[2]), 0, 0);
    } else if (/^\d{2}:\d{2}$/.test(timeValue.trim())) {
      const [hour, minute] = timeValue.trim().split(":").map(Number);
      date.setHours(hour, minute, 0, 0);
    }
  }
  return date;
}

async function getFaculty(userId) {
  const faculty = await prisma.facultyProfile.findUnique({
    where: { userId }, include: { subjectAssignments: { include: { subject: true } } },
  });
  if (!faculty) fail("Faculty profile not found", 403);
  return faculty;
}

function getAuthorizedSubjectAssignment(faculty, subjectId, academicYear, division) {
  const assignment = faculty.subjectAssignments.find((row) => row.subjectId === Number(subjectId)
    && row.academicYear === academicYear && row.subject.academicYear === academicYear
    && (!row.division || (division && divisionLetter(row.division) === divisionLetter(division))));
  if (!assignment) fail("You are not assigned to this subject and academic group", 403);
  return assignment;
}

async function studentRecipients(client, scope) {
  return client.studentProfile.findMany({
    where: {
      academicYear: scope.academicYear, year: scope.year, semester: scope.semester,
      enrollmentStatus: "ACTIVE", user: { status: "APPROVED", isActive: true },
      subjectEnrollments: { some: { subjectId: scope.subjectId, academicYear: scope.academicYear, status: "ACTIVE" } },
      ...(scope.division ? { division: { in: divisionVariants(scope.division) } } : {}),
      ...(scope.labBatch ? { labBatch: scope.labBatch } : {}),
    }, select: { userId: true },
  });
}

async function notifyScope(client, scope, note) {
  const students = await studentRecipients(client, scope);
  if (!students.length) return;
  await client.studentNotification.createMany({
    data: students.map((student) => ({
      recipientId: student.userId, type: note.type, title: note.title, body: note.body,
      dedupeKey: `${note.key}:${student.userId}`, relatedUrl: note.relatedUrl,
    })), skipDuplicates: true,
  });
}

function eventStatus(value) {
  if (value === "Draft" || value === "DRAFT") return "DRAFT";
  if (value === "Cancelled" || value === "CANCELLED") return "CANCELLED";
  return "PUBLISHED";
}

function parseMoney(value, label, { allowZero = false } = {}) {
  const raw = String(value ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) fail(`${label} must be a monetary amount with at most two decimal places`);
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0 || (!allowZero && amount === 0)) fail(`${label} must be ${allowZero ? "non-negative" : "positive"}`);
  return amount;
}

function mapEvent(event) {
  const status = event.status === "DRAFT" ? "Draft" : event.status === "CANCELLED" ? "Cancelled" : event.startsAt < new Date() ? "Completed" : "Upcoming";
  return {
    id: String(event.id), name: event.name, type: event.category || "Academic", category: event.category,
    description: event.description || "", venue: event.venue || "", startDate: event.startsAt,
    endDate: event.endsAt || event.startsAt, startTime: event.startsAt.toISOString(), endTime: event.endsAt?.toISOString() || null,
    registrationDeadline: event.registrationDeadline, maxParticipants: event.capacity,
    registeredCount: event._count?.registrations || 0, status, coordinator: event.organizer,
    organizer: event.organizer, banner: null, academicYear: event.targetAcademicYear,
    division: event.targetDivision, year: event.targetYear,
    assignedFaculty: (event.facultyAssignments || []).map((assignment) => ({
      id: String(assignment.facultyId), name: assignment.faculty.user.name,
      responsibility: assignment.responsibility, department: assignment.faculty.departmentName,
    })),
  };
}

exports.getFacultyTimetable = async (req, res, next) => {
  try {
    const faculty = await getFaculty(req.user.id);
    const entries = await prisma.timetableEntry.findMany({
      where: { facultyId: faculty.id }, include: { subject: true }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    return res.json({ success: true, entries });
  } catch (error) { next(error); }
};

exports.createTimetableEntry = async (req, res, next) => {
  try {
    const faculty = await getFaculty(req.user.id);
    const body = req.body || {};
    const academicYear = String(body.academicYear || "").trim();
    const year = body.year;
    const semester = Number(body.semester);
    const division = String(body.division || "").trim();
    const labBatch = body.labBatch ? String(body.labBatch).trim().toUpperCase() : null;
    const subjectAssignment = getAuthorizedSubjectAssignment(faculty, body.subjectId, academicYear, division);
    const subject = subjectAssignment.subject;
    if (year !== subject.year || semester !== subject.semester) fail("Academic year, student year and semester must match the assigned subject");
    if (!division || divisionLetter(division).length !== 1) fail("Select a division");
    const sessionType = body.sessionType;
    if (!["LECTURE", "LAB", "TUTORIAL"].includes(sessionType)) fail("Select a valid session type");
    if (sessionType === "LAB" && !labBatch) fail("Lab sessions require a lab batch");
    if (!validLabBatch(labBatch, division)) fail("The selected lab batch does not match the division");
    const dayOfWeek = Number(body.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) fail("Select a day of week");
    const startTime = String(body.startTime || "");
    const endTime = String(body.endTime || "");
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timePattern.test(startTime) || !timePattern.test(endTime) || endTime <= startTime) fail("Enter valid start and end times");
    const entry = await prisma.timetableEntry.create({ data: {
      academicYear, year, semester, division: divisionLetter(division), labBatch, dayOfWeek,
      startTime, endTime, room: String(body.room || "").trim() || null, sessionType,
      subjectId: subject.id, facultyId: faculty.id, createdById: req.user.id,
    }, include: { subject: true } });
    return res.status(201).json({ success: true, entry });
  } catch (error) { next(error); }
};

exports.deleteTimetableEntry = async (req, res, next) => {
  try {
    const faculty = await getFaculty(req.user.id);
    const id = Number(req.params.id);
    const result = await prisma.timetableEntry.deleteMany({ where: { id, facultyId: faculty.id } });
    if (!result.count) fail("Timetable entry not found", 404);
    return res.json({ success: true, deleted: true });
  } catch (error) { next(error); }
};

exports.listFacultyAssignments = async (req, res, next) => {
  try {
    const faculty = await getFaculty(req.user.id);
    const assignments = await prisma.academicAssignment.findMany({
      where: { facultyId: faculty.id }, include: { subject: true, _count: { select: { submissions: true } } }, orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, assignments: assignments.map((a) => ({ ...a, submissionsCount: a._count.submissions })) });
  } catch (error) { next(error); }
};

exports.createFacultyAssignment = async (req, res, next) => {
  try {
    const faculty = await getFaculty(req.user.id);
    const body = req.body || {};
    const academicYear = String(body.academicYear || "").trim();
    const division = body.division ? String(body.division).trim() : null;
    const labBatch = body.labBatch ? String(body.labBatch).trim().toUpperCase() : null;
    const assignment = getAuthorizedSubjectAssignment(faculty, body.subjectId, academicYear, division);
    const subject = assignment.subject;
    if (body.year && body.year !== subject.year) fail("Student year does not match the assigned subject");
    if (body.semester && Number(body.semester) !== subject.semester) fail("Semester does not match the assigned subject");
    if (labBatch && (!division || !validLabBatch(labBatch, division))) fail("A valid division and matching lab batch are required");
    const title = String(body.title || "").trim();
    if (!title || title.length > 180) fail("Assignment title is required and must be at most 180 characters");
    const dueAt = parseDate(body.dueAt || body.dueDate, "Due date");
    if (dueAt <= new Date()) fail("Assignment due date must be in the future");
    const maxMarks = body.maxMarks == null || body.maxMarks === "" ? null : Number(body.maxMarks);
    if (maxMarks !== null && (!Number.isFinite(maxMarks) || maxMarks < 0)) fail("Marks must be a non-negative amount");
    const status = body.status === "PUBLISHED" || body.publish === true ? "PUBLISHED" : "DRAFT";
    const attachmentUrl = validUrl(body.attachmentUrl);
    const saved = await prisma.$transaction(async (tx) => {
      const created = await tx.academicAssignment.create({ data: {
        subjectId: subject.id, facultyId: faculty.id, authorUserId: req.user.id,
        academicYear, year: subject.year, semester: subject.semester,
        division: division ? divisionLetter(division) : null, labBatch, title,
        description: String(body.description || "").trim() || null,
        attachmentUrl, attachmentName: body.attachmentName ? String(body.attachmentName).slice(0, 250) : null,
        dueAt, maxMarks, status, publishedAt: status === "PUBLISHED" ? new Date() : null,
      }, include: { subject: true } });
      if (status === "PUBLISHED") await notifyScope(tx, {
        subjectId: subject.id, academicYear, year: subject.year, semester: subject.semester,
        division: division ? divisionLetter(division) : null, labBatch,
      }, { type: "Assignment", title: "New assignment published", body: `${title} · ${subject.subjectName}`, key: `assignment:${created.id}`, relatedUrl: "/(main)/academics" });
      return created;
    }, { isolationLevel: "Serializable" });
    return res.status(201).json({ success: true, assignment: saved });
  } catch (error) { next(error); }
};

exports.updateFacultyAssignment = async (req, res, next) => {
  try {
    const faculty = await getFaculty(req.user.id);
    const id = Number(req.params.id);
    const existing = await prisma.academicAssignment.findFirst({ where: { id, facultyId: faculty.id }, include: { subject: true } });
    if (!existing) fail("Assignment not found", 404);
    const body = req.body || {};
    if (existing.status !== "DRAFT" && (body.subjectId || body.academicYear || body.division || body.labBatch)) fail("Published assignment group cannot be changed");
    const dueAt = body.dueAt || body.dueDate ? parseDate(body.dueAt || body.dueDate, "Due date") : existing.dueAt;
    const title = body.title === undefined ? existing.title : String(body.title).trim();
    if (!title) fail("Assignment title is required");
    const publish = body.status === "PUBLISHED" || body.publish === true;
    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.academicAssignment.update({ where: { id }, data: {
        title, description: body.description === undefined ? existing.description : String(body.description).trim() || null,
        dueAt, attachmentUrl: body.attachmentUrl === undefined ? existing.attachmentUrl : validUrl(body.attachmentUrl),
        attachmentName: body.attachmentName === undefined ? existing.attachmentName : body.attachmentName,
        maxMarks: body.maxMarks === undefined ? existing.maxMarks : body.maxMarks === null ? null : Number(body.maxMarks),
        status: publish ? "PUBLISHED" : existing.status,
        publishedAt: publish ? existing.publishedAt || new Date() : existing.publishedAt,
      }, include: { subject: true } });
      if (publish && existing.status !== "PUBLISHED") await notifyScope(tx, {
        subjectId: existing.subjectId, academicYear: existing.academicYear, year: existing.year,
        semester: existing.semester, division: existing.division, labBatch: existing.labBatch,
      }, { type: "Assignment", title: "New assignment published", body: `${saved.title} · ${saved.subject.subjectName}`, key: `assignment:${saved.id}`, relatedUrl: "/(main)/academics" });
      return saved;
    });
    return res.json({ success: true, assignment: updated });
  } catch (error) { next(error); }
};

exports.getAssignmentSubmissions = async (req, res, next) => {
  try {
    const faculty = await getFaculty(req.user.id);
    const id = Number(req.params.id);
    const assignment = await prisma.academicAssignment.findFirst({ where: { id, facultyId: faculty.id } });
    if (!assignment) fail("Assignment not found", 404);
    const submissions = await prisma.assignmentSubmission.findMany({ where: { assignmentId: id }, include: { student: { include: { user: { select: { name: true } } } } }, orderBy: { submittedAt: "asc" } });
    return res.json({ success: true, submissions: submissions.map((s) => ({
      id: s.id, studentId: s.student.studentId, rollNo: s.student.rollNo, name: s.student.user.name,
      responseText: s.responseText, attachmentUrl: s.attachmentUrl, attachmentName: s.attachmentName,
      submittedAt: s.submittedAt, marks: s.marks, feedback: s.feedback, feedbackReleased: s.feedbackReleased,
    })) });
  } catch (error) { next(error); }
};

exports.reviewAssignmentSubmission = async (req, res, next) => {
  try {
    const faculty = await getFaculty(req.user.id);
    const assignmentId = Number(req.params.id);
    const submissionId = Number(req.params.submissionId);
    const assignment = await prisma.academicAssignment.findFirst({ where: { id: assignmentId, facultyId: faculty.id } });
    if (!assignment) fail("Assignment not found", 404);
    const submission = await prisma.assignmentSubmission.findFirst({ where: { id: submissionId, assignmentId } });
    if (!submission) fail("Submission not found", 404);
    const marks = req.body?.marks == null || req.body?.marks === "" ? null : Number(req.body.marks);
    if (marks !== null && (!Number.isFinite(marks) || marks < 0 || (assignment.maxMarks != null && marks > Number(assignment.maxMarks)))) fail("Marks are outside the allowed range");
    const feedback = String(req.body?.feedback || "").trim() || null;
    const released = req.body?.release === true;
    const saved = await prisma.$transaction(async (tx) => {
      const updated = await tx.assignmentSubmission.update({ where: { id: submissionId }, data: { marks, feedback, feedbackReleased: released } });
      if (released) {
        const student = await tx.studentProfile.findUnique({ where: { id: submission.studentId }, select: { userId: true } });
        await createStudentNotification(tx, {
          recipientId: student.userId, type: "Assignment", title: "Assignment feedback available",
          body: `${assignment.title} has been reviewed.`, dedupeKey: `assignment-feedback:${submissionId}`,
          relatedUrl: "/(main)/academics",
        });
      }
      return updated;
    });
    return res.json({ success: true, submission: saved });
  } catch (error) { next(error); }
};

exports.listFacultyStudyPlans = async (req, res, next) => {
  try {
    const faculty = await getFaculty(req.user.id);
    const studyPlans = await prisma.studyPlan.findMany({ where: { facultyId: faculty.id }, include: { subject: true }, orderBy: [{ createdAt: "desc" }] });
    return res.json({ success: true, studyPlans });
  } catch (error) { next(error); }
};

exports.createFacultyStudyPlan = async (req, res, next) => {
  try {
    const faculty = await getFaculty(req.user.id);
    const body = req.body || {};
    const academicYear = String(body.academicYear || "").trim();
    const division = body.division ? String(body.division).trim() : null;
    const assignment = getAuthorizedSubjectAssignment(faculty, body.subjectId, academicYear, division);
    const subject = assignment.subject;
    const title = String(body.title || "").trim();
    if (!title) fail("Study plan title is required");
    const status = body.status === "PUBLISHED" || body.publish === true ? "PUBLISHED" : "DRAFT";
    const saved = await prisma.$transaction(async (tx) => {
      const previous = await tx.studyPlan.findFirst({ where: { subjectId: subject.id, academicYear, year: subject.year, semester: subject.semester }, orderBy: { version: "desc" } });
      const created = await tx.studyPlan.create({ data: {
        subjectId: subject.id, facultyId: faculty.id, academicYear, year: subject.year,
        semester: subject.semester, division: division ? divisionLetter(division) : null,
        title, description: String(body.description || "").trim() || null,
        fileUrl: validUrl(body.fileUrl), fileName: body.fileName ? String(body.fileName).slice(0, 250) : null,
        version: (previous?.version || 0) + 1, status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      }, include: { subject: true } });
      if (created.status === "PUBLISHED") await notifyScope(tx, {
        subjectId: subject.id, academicYear, year: subject.year, semester: subject.semester,
        division: created.division, labBatch: null,
      }, { type: "Academic", title: "Study plan published", body: `${created.title} · ${subject.subjectName}`, key: `study-plan:${created.id}`, relatedUrl: "/(main)/academics" });
      return created;
    }, { isolationLevel: "Serializable" });
    return res.status(201).json({ success: true, studyPlan: saved });
  } catch (error) { next(error); }
};

exports.publishStudyPlan = async (req, res, next) => {
  try {
    const faculty = await getFaculty(req.user.id);
    const id = Number(req.params.id);
    const plan = await prisma.studyPlan.findFirst({ where: { id, facultyId: faculty.id }, include: { subject: true } });
    if (!plan) fail("Study plan not found", 404);
    const saved = await prisma.$transaction(async (tx) => {
      const updated = await tx.studyPlan.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: plan.publishedAt || new Date() } });
      if (plan.status !== "PUBLISHED") await notifyScope(tx, {
        subjectId: plan.subjectId, academicYear: plan.academicYear, year: plan.year,
        semester: plan.semester, division: plan.division, labBatch: null,
      }, { type: "Academic", title: "Study plan published", body: `${plan.title} · ${plan.subject.subjectName}`, key: `study-plan:${plan.id}`, relatedUrl: "/(main)/academics" });
      return updated;
    });
    return res.json({ success: true, studyPlan: saved });
  } catch (error) { next(error); }
};

exports.listCoordinatorEvents = async (req, res, next) => {
  try {
    const events = await prisma.campusEvent.findMany({
      where: req.query.status && req.query.status !== "All" ? { status: eventStatus(req.query.status) } : {},
      include: {
        _count: { select: { registrations: { where: { status: "REGISTERED" } } } },
        facultyAssignments: {
          include: { faculty: { include: { user: { select: { name: true } } } } },
        },
      }, orderBy: { startsAt: "asc" },
    });
    const search = String(req.query.search || "").toLowerCase();
    return res.json({ success: true, events: events.filter((event) => !search || event.name.toLowerCase().includes(search)).map(mapEvent) });
  } catch (error) { next(error); }
};

exports.createCoordinatorEvent = async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = String(body.name || body.title || "").trim();
    if (!name) fail("Event name is required");
    const startsAt = parseDateTime(body.startsAt || body.startDate, body.startsAt ? null : body.startTime, "Event start date");
    const endsAt = body.endsAt || body.endDate ? parseDateTime(body.endsAt || body.endDate, body.endsAt ? null : body.endTime, "Event end date") : startsAt;
    if (endsAt < startsAt) fail("Event end must not be before the start");
    const capacity = body.capacity ?? body.maxParticipants;
    const numericCapacity = capacity == null || capacity === "" ? null : Number(capacity);
    if (numericCapacity !== null && (!Number.isInteger(numericCapacity) || numericCapacity < 1)) fail("Event capacity must be a positive whole number");
    const registrationDeadline = body.registrationDeadline ? parseDate(body.registrationDeadline, "Registration deadline") : null;
    const registrationOpensAt = body.registrationOpensAt || body.registrationStartDate ? parseDate(body.registrationOpensAt || body.registrationStartDate, "Registration opening date") : null;
    const organizer = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
    const targetDivision = body.targetDivision || body.division ? divisionLetter(body.targetDivision || body.division) : null;
    const targetLabBatch = String(body.targetLabBatch || body.labBatch || "").trim().toUpperCase() || null;
    if (targetLabBatch && (!targetDivision || !validLabBatch(targetLabBatch, targetDivision))) {
      fail("A lab batch requires a matching Division A or B target");
    }
    const event = await prisma.campusEvent.create({ data: {
      createdById: req.user.id, name, category: String(body.category || body.type || "").trim() || null,
      description: String(body.description || "").trim() || null,
      organizer: organizer?.name || null,
      venue: String(body.venue || "").trim() || null, startsAt, endsAt,
      registrationOpensAt, registrationDeadline,
      cancellationDeadline: body.cancellationDeadline ? parseDate(body.cancellationDeadline, "Cancellation deadline") : null,
      capacity: numericCapacity, allowCancellation: body.allowCancellation === true,
      targetAcademicYear: String(body.targetAcademicYear || body.academicYear || "").trim() || null,
      targetYear: validYear(body.targetYear || body.year) ? (body.targetYear || body.year) : null,
      targetDivision,
      targetLabBatch,
      status: eventStatus(body.status),
    } });
    return res.status(201).json({ success: true, event: mapEvent({ ...event, _count: { registrations: 0 }, facultyAssignments: [] }) });
  } catch (error) { next(error); }
};

exports.getCoordinatorEvent = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const event = await prisma.campusEvent.findUnique({ where: { id }, include: {
      _count: { select: { registrations: { where: { status: "REGISTERED" } } } },
      facultyAssignments: {
        include: { faculty: { include: { user: { select: { name: true } } } } },
      },
    } });
    if (!event) fail("Event not found", 404);
    return res.json({ success: true, event: mapEvent(event) });
  } catch (error) { next(error); }
};

exports.getCoordinatorDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const [totalEvents, upcomingEvents, totalRegistrations, totalFaculty, events, registrations] = await Promise.all([
      prisma.campusEvent.count(),
      prisma.campusEvent.count({ where: { status: "PUBLISHED", startsAt: { gte: now } } }),
      prisma.eventRegistration.count({ where: { status: "REGISTERED" } }),
      prisma.facultyProfile.count(),
      prisma.campusEvent.findMany({ where: { status: "PUBLISHED", startsAt: { gte: now } }, include: { _count: { select: { registrations: { where: { status: "REGISTERED" } } } } }, orderBy: { startsAt: "asc" }, take: 5 }),
      prisma.eventRegistration.findMany({ where: { status: "REGISTERED" }, include: { event: { select: { name: true } }, student: { include: { user: { select: { name: true } } } } }, orderBy: { registeredAt: "desc" }, take: 5 }),
    ]);
    return res.json({ success: true, stats: {
      totalEvents, activeEvents: upcomingEvents, totalParticipants: totalRegistrations,
      registeredParticipants: totalRegistrations, totalFaculty, mappedFaculty: null,
      todayEvents: await prisma.campusEvent.count({ where: { status: "PUBLISHED", startsAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lt: new Date(new Date().setHours(24, 0, 0, 0)) } } }),
      attendanceTakenRate: null, attendanceBreakdown: null,
    }, upcomingEvents: events.map((event) => mapEvent({ ...event, facultyAssignments: [] })), recentRegistrations: registrations.map((registration) => ({
      id: String(registration.id), studentId: registration.student.studentId,
      name: registration.student.user.name, event: registration.event.name, registeredAt: registration.registeredAt,
    })) });
  } catch (error) { next(error); }
};

exports.listCoordinatorParticipants = async (req, res, next) => {
  try {
    const eventId = req.query.eventId && req.query.eventId !== "All" ? Number(req.query.eventId) : undefined;
    const search = String(req.query.search || "").trim();
    const rows = await prisma.eventRegistration.findMany({
      where: { status: "REGISTERED", ...(eventId ? { eventId } : {}), ...(search ? { OR: [
        { student: { studentId: { contains: search, mode: "insensitive" } } },
        { student: { user: { name: { contains: search, mode: "insensitive" } } } },
      ] } : {}) },
      include: { event: true, student: { include: { user: { select: { name: true, email: true } } } } }, orderBy: { registeredAt: "desc" },
    });
    return res.json({ success: true, participants: rows.map((row) => ({
      id: String(row.id), studentId: row.student.studentId, name: row.student.user.name,
      email: row.student.user.email, department: row.student.departmentName,
      year: row.student.year, division: row.student.division, event: row.event.name,
      eventId: String(row.eventId), registrationStatus: "Confirmed", registeredAt: row.registeredAt,
      attendanceStatus: null,
    })) });
  } catch (error) { next(error); }
};

exports.addCoordinatorParticipant = async (req, res, next) => {
  try {
    const eventId = Number(req.body?.eventId);
    const studentKey = String(req.body?.studentId || "").trim();
    if (!Number.isInteger(eventId) || !studentKey) fail("Select an event and provide the existing student ID");
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "CampusEvent" WHERE "id" = ${eventId} FOR UPDATE`;
      const event = await tx.campusEvent.findUnique({ where: { id: eventId } });
      const student = await tx.studentProfile.findUnique({ where: { studentId: studentKey }, include: { user: { select: { status: true, isActive: true } } } });
      if (!event || event.status !== "PUBLISHED") fail("A published event is required", 404);
      if (!student || student.enrollmentStatus !== "ACTIVE" || student.user.status !== "APPROVED" || !student.user.isActive) fail("Existing approved active student not found", 404);
      if (event.targetAcademicYear && event.targetAcademicYear !== student.academicYear) fail("Student is outside this event's academic group", 403);
      if (event.targetYear && event.targetYear !== student.year) fail("Student is outside this event's academic group", 403);
      if (event.targetDivision && divisionLetter(event.targetDivision) !== divisionLetter(student.division)) fail("Student is outside this event's division", 403);
      if (event.targetLabBatch && event.targetLabBatch !== student.labBatch) fail("Student is outside this event's lab batch", 403);
      const old = await tx.eventRegistration.findUnique({ where: { eventId_studentId: { eventId, studentId: student.id } } });
      if (old?.status === "REGISTERED") return old;
      const count = await tx.eventRegistration.count({ where: { eventId, status: "REGISTERED" } });
      if (event.capacity && count >= event.capacity) fail("This event has reached its registration capacity", 409);
      const registration = old
        ? await tx.eventRegistration.update({ where: { id: old.id }, data: { status: "REGISTERED", registeredAt: new Date(), cancelledAt: null } })
        : await tx.eventRegistration.create({ data: { eventId, studentId: student.id } });
      await createStudentNotification(tx, {
        recipientId: student.userId, type: "Events", title: "Event registration confirmed",
        body: `Your registration for ${event.name} is confirmed.`, dedupeKey: `event-registration:${eventId}`,
        relatedUrl: "/(main)/events",
      });
      return registration;
    }, { isolationLevel: "Serializable" });
    return res.status(201).json({ success: true, participant: result });
  } catch (error) { next(error); }
};

exports.bulkAddCoordinatorParticipants = async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body?.participants) ? req.body.participants : [];
    if (!rows.length || rows.length > 500) fail("Provide between 1 and 500 existing student registrations");
    const eventIds = [...new Set(rows.map((row) => Number(row.eventId)).filter(Number.isInteger))];
    if (eventIds.length !== 1 || rows.some((row) => !String(row.studentId || "").trim())) fail("Each row must identify an existing student and the same event");
    const eventId = eventIds[0];
    const outcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "CampusEvent" WHERE "id" = ${eventId} FOR UPDATE`;
      const event = await tx.campusEvent.findUnique({ where: { id: eventId } });
      if (!event || event.status !== "PUBLISHED") fail("A published event is required", 404);
      let createdCount = 0;
      const conflicts = [];
      const seen = new Set();
      for (const row of rows) {
        const studentKey = String(row.studentId).trim();
        if (seen.has(studentKey)) { conflicts.push({ studentId: studentKey, reason: "Duplicate row in import" }); continue; }
        seen.add(studentKey);
        const student = await tx.studentProfile.findUnique({ where: { studentId: studentKey }, include: { user: { select: { status: true, isActive: true } } } });
        if (!student || student.enrollmentStatus !== "ACTIVE" || student.user.status !== "APPROVED" || !student.user.isActive) { conflicts.push({ studentId: studentKey, reason: "Approved active student record not found" }); continue; }
        if ((event.targetAcademicYear && event.targetAcademicYear !== student.academicYear)
          || (event.targetYear && event.targetYear !== student.year)
          || (event.targetDivision && divisionLetter(event.targetDivision) !== divisionLetter(student.division))
          || (event.targetLabBatch && event.targetLabBatch !== student.labBatch)) { conflicts.push({ studentId: studentKey, reason: "Student is outside the event's target group" }); continue; }
        const old = await tx.eventRegistration.findUnique({ where: { eventId_studentId: { eventId, studentId: student.id } } });
        if (old?.status === "REGISTERED") continue;
        const count = await tx.eventRegistration.count({ where: { eventId, status: "REGISTERED" } });
        if (event.capacity && count >= event.capacity) { conflicts.push({ studentId: studentKey, reason: "Event capacity reached" }); continue; }
        if (old) await tx.eventRegistration.update({ where: { id: old.id }, data: { status: "REGISTERED", registeredAt: new Date(), cancelledAt: null } });
        else await tx.eventRegistration.create({ data: { eventId, studentId: student.id } });
        await createStudentNotification(tx, {
          recipientId: student.userId, type: "Events", title: "Event registration confirmed",
          body: `Your registration for ${event.name} is confirmed.`, dedupeKey: `event-registration:${eventId}`,
          relatedUrl: "/(main)/events",
        });
        createdCount += 1;
      }
      return { createdCount, conflicts };
    }, { isolationLevel: "Serializable" });
    return res.json({ success: true, importedCount: outcome.createdCount, conflicts: outcome.conflicts });
  } catch (error) { next(error); }
};

exports.mapCoordinatorFacultyToEvent = async (req, res, next) => {
  try {
    const eventId = Number(req.body?.eventId);
    const facultyId = Number(req.body?.facultyId);
    const responsibility = String(req.body?.responsibility || "").trim();
    if (!Number.isInteger(eventId) || !Number.isInteger(facultyId) || !responsibility) fail("Select an event, faculty member and responsibility");
    const event = await prisma.campusEvent.findUnique({ where: { id: eventId } });
    if (!event) fail("Event not found", 404);
    const assignment = await prisma.eventFacultyAssignment.upsert({
      where: { eventId_facultyId: { eventId, facultyId } },
      update: { responsibility }, create: { eventId, facultyId, responsibility },
    });
    return res.json({ success: true, assignment });
  } catch (error) { next(error); }
};

exports.getCoordinatorReports = async (req, res, next) => {
  try {
    const events = await prisma.campusEvent.findMany({ include: { _count: { select: { registrations: { where: { status: "REGISTERED" } } } } }, orderBy: { startsAt: "desc" } });
    const totalRegistrations = events.reduce((sum, event) => sum + event._count.registrations, 0);
    return res.json({ success: true, totalEvents: events.length, totalRegistrations,
      eventWiseStats: events.map((event) => ({ eventName: event.name, department: event.targetAcademicYear || "All academic groups", registered: event._count.registrations, attendanceAvailable: false })),
      attendanceAnalyticsAvailable: false,
    });
  } catch (error) { next(error); }
};

exports.listCoordinatorFaculty = async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const faculty = await prisma.facultyProfile.findMany({
      where: search ? { OR: [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { employeeId: { contains: search, mode: "insensitive" } },
      ] } : {}, include: { user: { select: { name: true, email: true } }, eventAssignments: { include: { event: { select: { id: true, name: true } } } } }, orderBy: { user: { name: "asc" } },
    });
    return res.json({ success: true, faculty: faculty.map((row) => ({
      id: String(row.id), employeeId: row.employeeId, name: row.user.name, email: row.user.email,
      designation: row.designation, department: row.departmentName,
      mappedEvents: row.eventAssignments.map((assignment) => assignment.event.name),
    })) });
  } catch (error) { next(error); }
};

exports.createFeeCharge = async (req, res, next) => {
  try {
    const studentId = Number(req.body?.studentId);
    const amount = parseMoney(req.body?.amount, "Fee amount", { allowZero: true });
    const title = String(req.body?.title || "").trim();
    const academicYear = String(req.body?.academicYear || "").trim();
    if (!Number.isInteger(studentId) || !title || !academicYear) fail("Student, fee title and academic year are required");
    const student = await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { id: true, enrollmentStatus: true } });
    if (!student || student.enrollmentStatus !== "ACTIVE") fail("An active student profile is required", 404);
    const charge = await prisma.studentFeeCharge.create({ data: {
      studentId, createdById: req.user.id, title, academicYear, amount,
      dueDate: req.body?.dueDate ? parseDate(req.body.dueDate, "Due date") : null,
    } });
    return res.status(201).json({ success: true, charge });
  } catch (error) { next(error); }
};

exports.getAdminStudentFees = async (req, res, next) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) fail("A valid student profile is required");
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true } },
        feeCharges: { include: { payments: true }, orderBy: { createdAt: "desc" } },
        feePayments: { orderBy: { paidAt: "desc" } },
      },
    });
    if (!student) fail("Student not found", 404);
    return res.json({ success: true, fees: {
      student: { id: student.id, studentId: student.studentId, name: student.user.name, academicYear: student.academicYear },
      charges: student.feeCharges, payments: student.feePayments,
    } });
  } catch (error) { next(error); }
};

exports.recordFeePayment = async (req, res, next) => {
  try {
    const studentId = Number(req.body?.studentId);
    const chargeId = req.body?.chargeId == null ? null : Number(req.body.chargeId);
    const amount = parseMoney(req.body?.amount, "Payment amount");
    const receiptNumber = String(req.body?.receiptNumber || "").trim();
    if (!Number.isInteger(studentId) || !receiptNumber) fail("Student and receipt number are required");
    const student = await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { id: true, enrollmentStatus: true } });
    if (!student || student.enrollmentStatus !== "ACTIVE") fail("An active student profile is required", 404);
    if (chargeId) {
      const charge = await prisma.studentFeeCharge.findUnique({ where: { id: chargeId } });
      if (!charge || charge.studentId !== studentId) fail("Fee charge does not belong to this student");
    }
    const payment = await prisma.studentFeePayment.create({ data: {
      studentId, chargeId, amount, receiptNumber, paymentMethod: String(req.body?.paymentMethod || "").trim() || null,
      paidAt: req.body?.paidAt ? parseDate(req.body.paidAt, "Payment date") : new Date(),
      receiptUrl: validUrl(req.body?.receiptUrl),
    } });
    return res.status(201).json({ success: true, payment });
  } catch (error) { next(error); }
};

exports.listLibraryBooks = async (_req, res, next) => {
  try {
    const books = await prisma.libraryBook.findMany({ orderBy: { title: "asc" } });
    const counts = await prisma.libraryLoan.groupBy({ by: ["bookId"], where: { returnedAt: null }, _count: { _all: true } });
    const active = new Map(counts.map((row) => [row.bookId, row._count._all]));
    return res.json({ success: true, books: books.map((book) => ({ ...book, availableCopies: Math.max(0, book.totalCopies - (active.get(book.id) || 0)) })) });
  } catch (error) { next(error); }
};

exports.getLibraryPolicy = async (_req, res, next) => {
  try {
    const policy = await prisma.libraryPolicy.findUnique({ where: { id: 1 } });
    return res.json({ success: true, policy });
  } catch (error) { next(error); }
};

exports.listAdminLibraryLoans = async (_req, res, next) => {
  try {
    const loans = await prisma.libraryLoan.findMany({
      include: { book: true, student: { include: { user: { select: { name: true } } } } },
      orderBy: [{ returnedAt: "asc" }, { dueAt: "asc" }],
    });
    return res.json({ success: true, loans: loans.map((loan) => ({
      ...loan, studentName: loan.student.user.name,
      studentKey: loan.student.studentId, bookTitle: loan.book.title,
    })) });
  } catch (error) { next(error); }
};

exports.listAdminStudentDocuments = async (req, res, next) => {
  try {
    const status = req.query.status;
    const allowed = ["SUBMITTED", "VERIFIED", "REJECTED"];
    if (status && status !== "ALL" && !allowed.includes(status)) fail("Invalid document status filter");
    const documents = await prisma.studentDocument.findMany({
      where: status && status !== "ALL" ? { status } : {},
      include: { student: { include: { user: { select: { name: true } } } }, reviewer: { select: { name: true } } },
      orderBy: { submittedAt: "desc" },
    });
    return res.json({ success: true, documents: documents.map((document) => ({
      ...document, sizeBytes: Number(document.sizeBytes),
      studentName: document.student.user.name, studentKey: document.student.studentId,
      reviewerName: document.reviewer?.name || null,
    })) });
  } catch (error) { next(error); }
};

exports.createLibraryBook = async (req, res, next) => {
  try {
    const title = String(req.body?.title || "").trim();
    const totalCopies = Number(req.body?.totalCopies);
    if (!title || !Number.isInteger(totalCopies) || totalCopies < 0) fail("Book title and non-negative copy count are required");
    const book = await prisma.libraryBook.create({ data: {
      title, author: String(req.body?.author || "").trim() || null,
      publisher: String(req.body?.publisher || "").trim() || null,
      category: String(req.body?.category || "").trim() || null,
      isbn: String(req.body?.isbn || "").trim() || null,
      accessionCode: String(req.body?.accessionCode || "").trim() || null, totalCopies,
    } });
    return res.status(201).json({ success: true, book });
  } catch (error) { next(error); }
};

exports.issueLibraryBook = async (req, res, next) => {
  try {
    const bookId = Number(req.body?.bookId);
    const studentId = Number(req.body?.studentId);
    const dueAt = parseDate(req.body?.dueAt, "Due date");
    if (dueAt <= new Date()) fail("Library due date must be in the future");
    const loan = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "LibraryBook" WHERE "id" = ${bookId} FOR UPDATE`;
      const book = await tx.libraryBook.findUnique({ where: { id: bookId } });
      const student = await tx.studentProfile.findUnique({ where: { id: studentId }, select: { id: true, enrollmentStatus: true } });
      if (!book || !student || student.enrollmentStatus !== "ACTIVE") fail("Active book and student records are required", 404);
      const active = await tx.libraryLoan.count({ where: { bookId, returnedAt: null } });
      const policy = await tx.libraryPolicy.findUnique({ where: { id: 1 } });
      const studentLoans = await tx.libraryLoan.count({ where: { studentId, returnedAt: null } });
      if (active >= book.totalCopies) fail("No copy is currently available", 409);
      if (policy?.maxActiveLoans && studentLoans >= policy.maxActiveLoans) fail("Student has reached the configured loan limit", 409);
      return tx.libraryLoan.create({ data: { bookId, studentId, issuedById: req.user.id, dueAt } });
    }, { isolationLevel: "Serializable" });
    return res.status(201).json({ success: true, loan });
  } catch (error) { next(error); }
};

exports.returnLibraryBook = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const loan = await prisma.libraryLoan.updateMany({ where: { id, returnedAt: null }, data: { returnedAt: new Date(), returnedToId: req.user.id } });
    if (!loan.count) fail("Active library loan not found", 404);
    return res.json({ success: true, returned: true });
  } catch (error) { next(error); }
};

exports.configureLibraryPolicy = async (req, res, next) => {
  try {
    const maxActiveLoans = Number(req.body?.maxActiveLoans);
    const finePerDay = req.body?.finePerDay == null || req.body.finePerDay === "" ? null : Number(req.body.finePerDay);
    if (!Number.isInteger(maxActiveLoans) || maxActiveLoans < 0 || (finePerDay !== null && (!Number.isFinite(finePerDay) || finePerDay < 0))) fail("Configure a non-negative loan limit and optional non-negative daily fine");
    const policy = await prisma.libraryPolicy.upsert({ where: { id: 1 }, create: { id: 1, maxActiveLoans, finePerDay }, update: { maxActiveLoans, finePerDay } });
    return res.json({ success: true, policy });
  } catch (error) { next(error); }
};

exports.reviewStudentDocument = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = req.body?.status;
    if (!Number.isInteger(id) || !["VERIFIED", "REJECTED"].includes(status)) fail("Choose a valid document review status");
    const reviewerRemarks = String(req.body?.remarks || "").trim() || null;
    if (status === "REJECTED" && !reviewerRemarks) fail("A reason is required when rejecting a document");
    const saved = await prisma.$transaction(async (tx) => {
      const result = await tx.studentDocument.updateMany({ where: { id, status: "SUBMITTED" }, data: {
        status, reviewerId: req.user.id, reviewerRemarks, reviewedAt: new Date(),
      } });
      if (!result.count) fail("Submitted document not found or it has already been reviewed", 409);
      const document = await tx.studentDocument.findUnique({ where: { id } });
      const student = await tx.studentProfile.findUnique({ where: { id: document.studentId }, select: { userId: true } });
      await createStudentNotification(tx, {
        recipientId: student.userId, type: "Notices", title: `Document ${status.toLowerCase()}`,
        body: reviewerRemarks || `Your ${document.title} document was ${status.toLowerCase()}.`,
        dedupeKey: `document-review:${id}:${status}`, relatedUrl: "/(main)/profile",
      });
      return document;
    });
    return res.json({ success: true, document: saved });
  } catch (error) { next(error); }
};

exports.addStudentDocumentReference = async (req, res, next) => {
  try {
    const studentId = Number(req.params.studentId);
    const student = await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { id: true } });
    if (!student) fail("Student not found", 404);
    const title = String(req.body?.title || "").trim();
    const documentType = String(req.body?.documentType || "").trim();
    const fileName = String(req.body?.fileName || "").trim();
    const mimeType = String(req.body?.mimeType || "").trim().toLowerCase();
    const fileUrl = validUrl(req.body?.fileUrl);
    const sizeBytes = Number(req.body?.sizeBytes);
    if (!title || !documentType || !fileName || !fileUrl || !Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > 10485760) fail("A stored HTTPS file, name, type, and size up to 10 MB are required");
    if (!["application/pdf", "image/jpeg", "image/png"].includes(mimeType)) fail("Only PDF, JPEG and PNG document references are allowed");
    const document = await prisma.studentDocument.create({ data: {
      studentId, title, documentType, fileName, mimeType, sizeBytes: BigInt(sizeBytes), fileUrl,
    } });
    return res.status(201).json({ success: true, document: { ...document, sizeBytes: sizeBytes } });
  } catch (error) { next(error); }
};

