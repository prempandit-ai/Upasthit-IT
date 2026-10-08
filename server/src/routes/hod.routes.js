const express = require("express");
const hodController = require("../controllers/hod.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");
const validate = require("../middleware/validate.middleware");
const { createUserRules } = require("../validators/user.validator");

const router = express.Router();

router.use(authenticate, requireApproved, authorize("HOD"));

router.post(
  "/create-coordinator",
  createUserRules,
  validate,
  hodController.createCoordinator
);
router.get("/pending-faculty", hodController.listPendingFaculty);
router.patch("/faculty/:id/approve", hodController.approveFaculty);
router.patch("/faculty/:id/reject", hodController.rejectFaculty);

module.exports = router;
