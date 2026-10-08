const express = require("express");
const coordinatorController = require("../controllers/coordinator.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");

const router = express.Router();

router.use(authenticate, requireApproved, authorize("COORDINATOR"));

// Dashboard stats
router.get("/dashboard", coordinatorController.getDashboard);

// Pending students
router.get("/pending-students", coordinatorController.listPendingStudents);

// Approve / reject students
router.patch("/students/:id/approve", coordinatorController.approveStudent);
router.patch("/students/:id/reject", coordinatorController.rejectStudent);

// Approval history
router.get("/approval-history", coordinatorController.getApprovalHistory);

module.exports = router;
