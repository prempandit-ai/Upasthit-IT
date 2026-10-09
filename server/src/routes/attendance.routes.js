const express = require("express");
const attendanceController = require("../controllers/attendance.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");

const router = express.Router();

router.use(authenticate, requireApproved, authorize("FACULTY"));

router.get("/faculty/assignments", attendanceController.getFacultyAssignments);
router.get("/eligible-students", attendanceController.getEligibleStudents);
router.get("/students", attendanceController.getClassStudents);
router.get("/history", attendanceController.getHistory);
router.get("/sessions/active", attendanceController.getActiveSession);
router.post("/sessions", attendanceController.createSession);
router.post("/sessions/:id/start", attendanceController.startSession);
router.get("/sessions/:id/students", attendanceController.getSessionStudents);
router.get("/sessions/:id/summary", attendanceController.getSessionSummary);
router.post("/sessions/:id/records", attendanceController.saveRecords);
router.post("/sessions/:id/complete", attendanceController.completeSession);
router.get("/sessions/:id", attendanceController.getSession);

module.exports = router;
