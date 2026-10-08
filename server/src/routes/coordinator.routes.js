const express = require("express");
const coordinatorController = require("../controllers/coordinator.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");

const router = express.Router();

router.use(authenticate, requireApproved, authorize("COORDINATOR"));

router.get("/pending-students", coordinatorController.listPendingStudents);
router.patch("/students/:id/approve", coordinatorController.approveStudent);
router.patch("/students/:id/reject", coordinatorController.rejectStudent);

module.exports = router;
