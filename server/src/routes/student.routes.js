const express = require("express");
const studentController = require("../controllers/student.controller");
const studentPortalController = require("../controllers/studentPortal.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");
const validate = require("../middleware/validate.middleware");
const { createStudentRules, updateStudentRules } = require("../validators/student.validator");

const router = express.Router();

router.use(authenticate, requireApproved);

// ─── Student Self-Service (Authenticated Student Only) ─────────────────────────
router.get("/profile", authorize("STUDENT"), studentController.getMyProfile);
router.get("/subjects", authorize("STUDENT"), studentController.getMySubjects);
router.get("/dashboard", authorize("STUDENT"), studentController.getMyDashboard);
router.get("/attendance", authorize("STUDENT"), studentController.getMyAttendance);
router.get("/attendance/sessions/active", authorize("STUDENT"), studentController.getMyActiveAttendanceSessions);
router.post("/attendance/sessions/:id/check-in", authorize("STUDENT"), studentController.checkInToAttendanceSession);
router.patch("/profile", authorize("STUDENT"), studentPortalController.updateProfile);
router.get("/timetable", authorize("STUDENT"), studentPortalController.getTimetable);
router.get("/timetable/today", authorize("STUDENT"), (req, res, next) => {
  req.query.day = String(((new Date().getDay() + 6) % 7) + 1);
  return studentPortalController.getTimetable(req, res, next);
});
router.get("/assignments", authorize("STUDENT"), studentPortalController.getAssignments);
router.get("/assignments/:id", authorize("STUDENT"), studentPortalController.getAssignment);
router.post("/assignments/:id/submissions", authorize("STUDENT"), studentPortalController.submitAssignment);
router.get("/study-plans", authorize("STUDENT"), studentPortalController.getStudyPlans);
router.get("/requests", authorize("STUDENT"), studentPortalController.getLeaveRequests);
router.post("/requests", authorize("STUDENT"), studentPortalController.createLeaveRequest);
router.get("/events", authorize("STUDENT"), studentPortalController.getEvents);
router.post("/events/:id/register", authorize("STUDENT"), studentPortalController.registerForEvent);
router.delete("/events/:id/register", authorize("STUDENT"), studentPortalController.cancelEventRegistration);
router.get("/notifications", authorize("STUDENT"), studentPortalController.getNotifications);
router.patch("/notifications/:id/read", authorize("STUDENT"), studentPortalController.markNotificationRead);
router.get("/documents", authorize("STUDENT"), studentPortalController.getDocuments);
router.get("/fees", authorize("STUDENT"), studentPortalController.getFees);
router.get("/library", authorize("STUDENT"), studentPortalController.getLibrary);

// List students — Coordinator, HOD, Admin, Faculty
router.get(
  "/",
  authorize("ADMIN", "HOD", "COORDINATOR", "FACULTY"),
  studentController.listStudents
);

// Get student by profile ID
router.get(
  "/:id",
  authorize("ADMIN", "HOD", "COORDINATOR", "FACULTY"),
  studentController.getStudent
);

// Get student by GR number
router.get(
  "/gr/:studentId",
  authorize("ADMIN", "HOD", "COORDINATOR", "FACULTY"),
  studentController.getStudentByStudentId
);

// Get subjects for a student
router.get(
  "/:id/subjects",
  authorize("ADMIN", "HOD", "COORDINATOR", "FACULTY", "STUDENT"),
  studentController.getStudentSubjects
);

// Create student — Admin / Coordinator only
router.post(
  "/",
  authorize("ADMIN", "COORDINATOR"),
  createStudentRules,
  validate,
  studentController.createStudent
);

// Update student — Admin / Coordinator
router.put(
  "/:id",
  authorize("ADMIN", "COORDINATOR"),
  updateStudentRules,
  validate,
  studentController.updateStudent
);

// Delete student — Admin only
router.delete("/:id", authorize("ADMIN"), studentController.deleteStudent);

module.exports = router;
