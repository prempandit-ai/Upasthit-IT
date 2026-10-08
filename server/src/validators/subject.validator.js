const { body } = require("express-validator");

const VALID_YEARS = ["FY", "SY", "TY", "BE"];
const VALID_TYPES = ["THEORY", "PRACTICAL", "ELECTIVE", "AUDIT"];

const createSubjectRules = [
  body("subjectCode").trim().notEmpty().withMessage("Subject code is required"),
  body("subjectName").trim().notEmpty().withMessage("Subject name is required"),
  body("subjectType")
    .optional()
    .isIn(VALID_TYPES)
    .withMessage(`Subject type must be one of: ${VALID_TYPES.join(", ")}`),
  body("credits").optional().isInt({ min: 0 }).withMessage("Credits must be a non-negative integer"),
  body("departmentCode").trim().notEmpty().withMessage("Department code is required"),
  body("academicYear").trim().notEmpty().withMessage("Academic year is required"),
  body("semester")
    .isInt({ min: 1, max: 8 })
    .withMessage("Semester must be between 1 and 8"),
  body("year")
    .isIn(VALID_YEARS)
    .withMessage(`Year must be one of: ${VALID_YEARS.join(", ")}`),
];

module.exports = { createSubjectRules };
