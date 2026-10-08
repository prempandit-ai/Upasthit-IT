const { body } = require("express-validator");

const createFacultyRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("employeeId").trim().notEmpty().withMessage("Employee ID is required"),
  body("departmentCode").trim().notEmpty().withMessage("Department code is required"),
  body("departmentName").trim().notEmpty().withMessage("Department name is required"),
];

module.exports = { createFacultyRules };
