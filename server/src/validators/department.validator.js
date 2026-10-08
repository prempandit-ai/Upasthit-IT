const { body } = require("express-validator");

const departmentRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Department code is required")
    .isLength({ min: 2, max: 10 })
    .withMessage("Department code must be 2–10 characters"),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Department name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Department name must be 2–100 characters"),
];

module.exports = { departmentRules };
