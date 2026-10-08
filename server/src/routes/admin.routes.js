const express = require("express");
const adminController = require("../controllers/admin.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");
const validate = require("../middleware/validate.middleware");
const { createUserRules } = require("../validators/user.validator");

const router = express.Router();

router.use(authenticate, requireApproved, authorize("ADMIN"));

router.post("/create-hod", createUserRules, validate, adminController.createHod);
router.post(
  "/create-faculty",
  createUserRules,
  validate,
  adminController.createFaculty
);
router.get("/users", adminController.listUsers);
router.patch("/users/:id/approve", adminController.approveUser);
router.patch("/users/:id/reject", adminController.rejectUser);
router.patch("/users/:id/deactivate", adminController.deactivateUser);

module.exports = router;
