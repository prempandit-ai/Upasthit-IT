const express = require("express");
const adminController = require("../controllers/admin.controller");
const portalManagementController = require("../controllers/studentPortalManagement.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");
const validate = require("../middleware/validate.middleware");
const { createUserRules } = require("../validators/user.validator");

const router = express.Router();

router.use(authenticate, requireApproved, authorize("ADMIN"));

router.post("/create-hod", createUserRules, validate, adminController.createHod);
router.post(
  "/create-faculty",
  createUserRules,
  validate,
  adminController.createFaculty
);
router.get("/users", adminController.listUsers);
router.patch("/users/:id/approve", adminController.approveUser);
router.patch("/users/:id/reject", adminController.rejectUser);
router.patch("/users/:id/deactivate", adminController.deactivateUser);
router.post("/fees/charges", portalManagementController.createFeeCharge);
router.get("/fees/students/:studentId", portalManagementController.getAdminStudentFees);
router.post("/fees/payments", portalManagementController.recordFeePayment);
router.get("/library/books", portalManagementController.listLibraryBooks);
router.get("/library/policy", portalManagementController.getLibraryPolicy);
router.get("/library/loans", portalManagementController.listAdminLibraryLoans);
router.post("/library/books", portalManagementController.createLibraryBook);
router.post("/library/loans", portalManagementController.issueLibraryBook);
router.patch("/library/loans/:id/return", portalManagementController.returnLibraryBook);
router.put("/library/policy", portalManagementController.configureLibraryPolicy);
router.post("/students/:studentId/documents", portalManagementController.addStudentDocumentReference);
router.get("/documents", portalManagementController.listAdminStudentDocuments);
router.patch("/documents/:id/review", portalManagementController.reviewStudentDocument);

module.exports = router;
