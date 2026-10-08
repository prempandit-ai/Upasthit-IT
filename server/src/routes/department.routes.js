const express = require("express");
const departmentController = require("../controllers/department.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");
const validate = require("../middleware/validate.middleware");
const { departmentRules } = require("../validators/department.validator");

const router = express.Router();

// All department routes require authentication
router.use(authenticate, requireApproved);

// GET — any approved role can list/view departments
router.get("/", departmentController.listDepartments);
router.get("/:id", departmentController.getDepartment);

// Write operations — ADMIN or HOD only
router.post(
  "/",
  authorize("ADMIN", "HOD"),
  departmentRules,
  validate,
  departmentController.createDepartment
);
router.put("/:id", authorize("ADMIN", "HOD"), departmentController.updateDepartment);
router.delete("/:id", authorize("ADMIN"), departmentController.deleteDepartment);

module.exports = router;
