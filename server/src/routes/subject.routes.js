const express = require("express");
const subjectController = require("../controllers/subject.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");
const validate = require("../middleware/validate.middleware");
const { createSubjectRules } = require("../validators/subject.validator");

const router = express.Router();

router.use(authenticate, requireApproved);

// List subjects — all approved roles
router.get("/", subjectController.listSubjects);

// Get subject by ID
router.get("/:id", subjectController.getSubject);

// Get students enrolled in a subject
router.get(
  "/:id/students",
  authorize("ADMIN", "HOD", "COORDINATOR", "FACULTY"),
  subjectController.getEnrolledStudents
);

// Create subject — Admin / HOD / Coordinator
router.post(
  "/",
  authorize("ADMIN", "HOD", "COORDINATOR"),
  createSubjectRules,
  validate,
  subjectController.createSubject
);

// Update subject — Admin / HOD
router.put("/:id", authorize("ADMIN", "HOD"), subjectController.updateSubject);

// Enroll a student in subject — Admin / Coordinator
router.post(
  "/:id/enroll",
  authorize("ADMIN", "COORDINATOR"),
  subjectController.enrollStudent
);

// Remove enrollment — Admin / Coordinator
router.delete(
  "/:id/enrollments/:enrollmentId",
  authorize("ADMIN", "COORDINATOR"),
  subjectController.removeEnrollment
);

// Delete subject — Admin only
router.delete("/:id", authorize("ADMIN"), subjectController.deleteSubject);

module.exports = router;
