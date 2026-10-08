const express = require("express");
const multer = require("multer");
const path = require("path");
const importController = require("../controllers/import.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const requireApproved = require("../middleware/approval.middleware");

const router = express.Router();

// Multer config — store in uploads/, accept only Excel
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files (.xlsx, .xls) are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// All import routes require Auth + ADMIN or COORDINATOR
router.use(authenticate, requireApproved, authorize("ADMIN", "COORDINATOR"));

// Preview any Excel file — returns sheet names, headers, sample row
router.post("/preview", upload.single("file"), importController.previewFile);

// Import subjects
router.post("/subjects", upload.single("file"), importController.importSubjects);

// Import faculty
router.post("/faculty", upload.single("file"), importController.importFaculty);

// Import students
router.post("/students", upload.single("file"), importController.importStudents);

module.exports = router;
