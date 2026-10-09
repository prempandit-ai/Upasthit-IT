const express = require("express");
const authController = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");
const validate = require("../middleware/validate.middleware");
const { registerRules, loginRules } = require("../validators/auth.validator");

const router = express.Router();

router.post(
  "/register-student",
  registerRules,
  validate,
  authController.registerStudent
);
router.post(
  "/register-faculty",
  registerRules,
  validate,
  authController.registerFaculty
);
router.post("/register", registerRules, validate, authController.registerStudent);
router.post("/login", loginRules, validate, authController.login);
router.post("/change-password", authenticate, authController.changePassword);
router.get("/me", authenticate, requireApproved, authController.getMe);

router.get(
  "/student-only",
  authenticate,
  requireApproved,
  authorize("STUDENT"),
  (req, res) => {
    res.json({
      success: true,
      message: "Student route accessible",
      user: req.user,
    });
  }
);

router.get(
  "/faculty-only",
  authenticate,
  requireApproved,
  authorize("FACULTY"),
  (req, res) => {
    res.json({
      success: true,
      message: "Faculty route accessible",
      user: req.user,
    });
  }
);

router.get(
  "/hod-only",
  authenticate,
  requireApproved,
  authorize("HOD"),
  (req, res) => {
    res.json({
      success: true,
      message: "HOD route accessible",
      user: req.user,
    });
  }
);

router.get(
  "/coordinator-only",
  authenticate,
  requireApproved,
  authorize("COORDINATOR"),
  (req, res) => {
    res.json({
      success: true,
      message: "Coordinator route accessible",
      user: req.user,
    });
  }
);

router.get(
  "/admin-only",
  authenticate,
  requireApproved,
  authorize("ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      message: "Admin route accessible",
      user: req.user,
    });
  }
);

module.exports = router;

