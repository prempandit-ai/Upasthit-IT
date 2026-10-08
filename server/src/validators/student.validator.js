const { body } = require("express-validator");

const VALID_YEARS = ["FY", "SY", "TY", "BE"];
const VALID_STATUSES = ["ACTIVE", "DROPPED", "COMPLETED"];

const createStudentRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("studentId").trim().notEmpty().withMessage("Student ID / GR Number is required"),
  body("departmentCode").trim().notEmpty().withMessage("Department code is required"),
  body("departmentName").trim().notEmpty().withMessage("Department name is required"),
  body("academicYear").trim().notEmpty().withMessage("Academic year is required"),
  body("semester")
    .isInt({ min: 1, max: 8 })
    .withMessage("Semester must be between 1 and 8"),
  body("year")
    .isIn(VALID_YEARS)
    .withMessage(`Year must be one of: ${VALID_YEARS.join(", ")}`),
];

const updateStudentRules = [
  body("semester")
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage("Semester must be between 1 and 8"),
  body("year")
    .optional()
    .isIn(VALID_YEARS)
    .withMessage(`Year must be one of: ${VALID_YEARS.join(", ")}`),
  body("enrollmentStatus")
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Enrollment status must be one of: ${VALID_STATUSES.join(", ")}`),
];

module.exports = { createStudentRules, updateStudentRules };
