const express = require("express");
const hodController = require("../controllers/hod.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");
const validate = require("../middleware/validate.middleware");
const { createUserRules } = require("../validators/user.validator");

const router = express.Router();

router.use(authenticate, requireApproved, authorize("HOD"));

// Department overview
router.get("/dashboard", hodController.getDepartmentOverview);

// Faculty in department
router.get("/faculty", hodController.listDepartmentFaculty);

// Create Coordinator (with profile)
router.post("/create-coordinator", createUserRules, validate, hodController.createCoordinator);

// Pending faculty
router.get("/pending-faculty", hodController.listPendingFaculty);

// Approve / reject faculty
router.patch("/faculty/:id/approve", hodController.approveFaculty);
router.patch("/faculty/:id/reject", hodController.rejectFaculty);

// HOD profile creation (called by Admin after creating HOD User)
router.post("/profile", hodController.createHodProfile);

// Approval history
router.get("/approval-history", hodController.getApprovalHistory);

module.exports = router;
