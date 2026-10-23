const express = require("express");
const coordinatorController = require("../controllers/coordinator.controller");
const eventController = require("../controllers/event.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");

const router = express.Router();

router.use(authenticate, requireApproved, authorize("COORDINATOR"));

// Dashboard stats
router.get("/dashboard", coordinatorController.getDashboard);

// Lab batch allocation and coordinator adjustments
router.get("/student-batches", coordinatorController.listStudentBatches);
router.patch("/student-batches/:id", coordinatorController.updateStudentBatch);

// Events
router.get("/events", eventController.listEvents);
router.post("/events", eventController.createEvent);

// Pending students
router.get("/pending-students", coordinatorController.listPendingStudents);

// Approve / reject students
router.patch("/students/:id/approve", coordinatorController.approveStudent);
router.patch("/students/:id/reject", coordinatorController.rejectStudent);

// Approval history
router.get("/approval-history", coordinatorController.getApprovalHistory);

module.exports = router;
