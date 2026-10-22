const { body } = require("express-validator");
const {
  VALID_YEARS,
  PROGRAMS,
  DIVISIONS,
  GENDERS,
  BLOOD_GROUPS,
  RELATIONSHIPS,
} = require("../utils/studentRegistration");

const registerRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

const optionalTrimmed = (field) =>
  body(field)
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 200 })
    .withMessage(`${field} is too long`);

const studentRegisterRules = [
  ...registerRules,
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  body("departmentId")
    .notEmpty()
    .withMessage("Department is required")
    .isInt({ min: 1 })
    .withMessage("Department is invalid")
    .toInt(),
  body("program")
    .trim()
    .notEmpty()
    .withMessage("Academic program is required")
    .isIn(PROGRAMS)
    .withMessage(`Program must be one of: ${PROGRAMS.join(", ")}`),
  body("rollNo")
    .notEmpty()
    .withMessage("Roll number is required")
    .isInt({ min: 1, max: 9999 })
    .withMessage("Roll number must be a positive number")
    .toInt(),
  body("academicYear")
    .trim()
    .notEmpty()
    .withMessage("Academic year is required")
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("Academic year must look like 2026-27"),
  body("year")
    .trim()
    .notEmpty()
    .withMessage("Year of study is required")
    .isIn(VALID_YEARS)
    .withMessage(`Year must be one of: ${VALID_YEARS.join(", ")}`),
  body("semester")
    .notEmpty()
    .withMessage("Semester is required")
    .isInt({ min: 1, max: 8 })
    .withMessage("Semester must be between 1 and 8")
    .toInt(),
  body("division")
    .trim()
    .notEmpty()
    .withMessage("Division is required")
    .isIn(DIVISIONS)
    .withMessage(`Division must be one of: ${DIVISIONS.join(", ")}`),
  body("studentId").optional({ values: "falsy" }).trim().isLength({ min: 3, max: 40 }),
  body("dateOfBirth")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Date of birth must be a valid date"),
  body("gender")
    .optional({ values: "falsy" })
    .trim()
    .isIn(GENDERS)
    .withMessage(`Gender must be one of: ${GENDERS.join(", ")}`),
  body("bloodGroup")
    .optional({ values: "falsy" })
    .trim()
    .isIn(BLOOD_GROUPS)
    .withMessage(`Blood group must be one of: ${BLOOD_GROUPS.join(", ")}`),
  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .matches(/^[0-9+\-\s]{8,20}$/)
    .withMessage("Enter a valid phone number"),
  body("emergencyContactPhone")
    .optional({ values: "falsy" })
    .trim()
    .matches(/^[0-9+\-\s]{8,20}$/)
    .withMessage("Enter a valid emergency contact phone number"),
  body("emergencyContactRelationship")
    .optional({ values: "falsy" })
    .trim()
    .isIn(RELATIONSHIPS)
    .withMessage(`Relationship must be one of: ${RELATIONSHIPS.join(", ")}`),
  optionalTrimmed("nationality"),
  optionalTrimmed("fatherName"),
  optionalTrimmed("motherName"),
  body("address").optional({ values: "falsy" }).trim().isLength({ max: 500 }),
  optionalTrimmed("emergencyContactName"),
];

const loginRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = { registerRules, studentRegisterRules, loginRules };
