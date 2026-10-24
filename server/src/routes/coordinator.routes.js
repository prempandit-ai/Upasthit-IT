const express = require("express");
const coordinatorController = require("../controllers/coordinator.controller");
const portalManagementController = require("../controllers/studentPortalManagement.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");

const router = express.Router();

router.use(authenticate, requireApproved, authorize("COORDINATOR"));

// Dashboard stats
router.get("/dashboard", coordinatorController.getDashboard);
router.get("/dashboard/portal-events", portalManagementController.getCoordinatorDashboardStats);
router.get("/reports/events", portalManagementController.getCoordinatorReports);
router.get("/faculty", portalManagementController.listCoordinatorFaculty);
router.post("/faculty/mapping", portalManagementController.mapCoordinatorFacultyToEvent);
router.get("/participants", portalManagementController.listCoordinatorParticipants);
router.post("/participants", portalManagementController.addCoordinatorParticipant);
router.post("/participants/bulk", portalManagementController.bulkAddCoordinatorParticipants);
router.get("/events", portalManagementController.listCoordinatorEvents);
router.get("/events/:id", portalManagementController.getCoordinatorEvent);
router.post("/events", portalManagementController.createCoordinatorEvent);

// Lab batch allocation and coordinator adjustments
router.get("/student-batches", coordinatorController.listStudentBatches);
router.patch("/student-batches/:id", coordinatorController.updateStudentBatch);

// Pending students
router.get("/pending-students", coordinatorController.listPendingStudents);

// Approve / reject students
router.patch("/students/:id/approve", coordinatorController.approveStudent);
router.patch("/students/:id/reject", coordinatorController.rejectStudent);

// Approval history
router.get("/approval-history", coordinatorController.getApprovalHistory);

module.exports = router;
