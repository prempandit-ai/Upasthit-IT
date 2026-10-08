const express = require("express");
const facultyController = require("../controllers/faculty.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");
const validate = require("../middleware/validate.middleware");
const { createFacultyRules } = require("../validators/faculty.validator");

const router = express.Router();

router.use(authenticate, requireApproved);

// List all faculty — Admin, HOD, Coordinator
router.get("/", authorize("ADMIN", "HOD", "COORDINATOR"), facultyController.listFaculty);

// Get one faculty member
router.get("/:id", authorize("ADMIN", "HOD", "COORDINATOR"), facultyController.getFaculty);

// Get assigned subjects for a faculty
router.get(
  "/:id/subjects",
  authorize("ADMIN", "HOD", "COORDINATOR", "FACULTY"),
  facultyController.getAssignedSubjects
);

// Create faculty — Admin / HOD
router.post(
  "/",
  authorize("ADMIN", "HOD"),
  createFacultyRules,
  validate,
  facultyController.createFaculty
);

// Update faculty — Admin / HOD
router.put("/:id", authorize("ADMIN", "HOD"), facultyController.updateFaculty);

// Assign subject to faculty — Admin / HOD / Coordinator
router.post(
  "/:id/assign-subject",
  authorize("ADMIN", "HOD", "COORDINATOR"),
  facultyController.assignSubject
);

// Remove subject assignment
router.delete(
  "/:id/assignments/:assignmentId",
  authorize("ADMIN", "HOD", "COORDINATOR"),
  facultyController.removeSubjectAssignment
);

// Delete faculty — Admin only
router.delete("/:id", authorize("ADMIN"), facultyController.deleteFaculty);

module.exports = router;
