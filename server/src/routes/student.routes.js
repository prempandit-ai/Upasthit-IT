const express = require("express");
const studentController = require("../controllers/student.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");
const validate = require("../middleware/validate.middleware");
const { createStudentRules, updateStudentRules } = require("../validators/student.validator");

const router = express.Router();

router.use(authenticate, requireApproved);

// List students — Coordinator, HOD, Admin, Faculty
router.get(
  "/",
  authorize("ADMIN", "HOD", "COORDINATOR", "FACULTY"),
  studentController.listStudents
);

// Get student by profile ID
router.get(
  "/:id",
  authorize("ADMIN", "HOD", "COORDINATOR", "FACULTY"),
  studentController.getStudent
);

// Get student by GR number
router.get(
  "/gr/:studentId",
  authorize("ADMIN", "HOD", "COORDINATOR", "FACULTY"),
  studentController.getStudentByStudentId
);

// Get subjects for a student
router.get(
  "/:id/subjects",
  authorize("ADMIN", "HOD", "COORDINATOR", "FACULTY", "STUDENT"),
  studentController.getStudentSubjects
);

// Create student — Admin / Coordinator only
router.post(
  "/",
  authorize("ADMIN", "COORDINATOR"),
  createStudentRules,
  validate,
  studentController.createStudent
);

// Update student — Admin / Coordinator
router.put(
  "/:id",
  authorize("ADMIN", "COORDINATOR"),
  updateStudentRules,
  validate,
  studentController.updateStudent
);

// Delete student — Admin only
router.delete("/:id", authorize("ADMIN"), studentController.deleteStudent);

module.exports = router;
