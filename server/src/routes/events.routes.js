const express = require("express");
const eventController = require("../controllers/event.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");

const router = express.Router();

router.use(authenticate, requireApproved);

// ─── Event Viewing (Admin, HOD, Coordinator, Faculty, Student) ────────────────
router.get("/stats", authorize("ADMIN", "HOD", "COORDINATOR", "FACULTY", "STUDENT"), eventController.getEventStats);
router.get("/:id", authorize("ADMIN", "HOD", "COORDINATOR", "FACULTY", "STUDENT"), eventController.getEventById);
router.get("/", authorize("ADMIN", "HOD", "COORDINATOR", "FACULTY", "STUDENT"), eventController.listEvents);

// ─── Event Creation (Restricted to Event Coordinator, HOD, Admin; Faculty blocked) ─
router.post(
  "/",
  authorize("ADMIN", "HOD", "COORDINATOR"),
  eventController.createEvent
);

module.exports = router;
