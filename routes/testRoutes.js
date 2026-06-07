import express from "express";
import multer from "multer";
import {
  generateTest,
  getTest,
  submitTest,
  getBookmarks,
  toggleBookmark,
  importExcelQuestions,
  importPdfQuestions,
  getLeaderboard,
  getStudentDashboardStats,
} from "../controller/testController.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/security.js";

const router = express.Router();

// Multer memory storage configuration for file parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // limit files to 5MB
});

// All these routes require a logged-in student/user
router.use(authMiddleware);

router.post("/generate", apiLimiter, generateTest);
router.get("/details/:id", getTest);
router.post("/submit", submitTest);

router.get("/bookmarks", getBookmarks);
router.post("/bookmark", toggleBookmark);

router.get("/leaderboard", getLeaderboard);
router.get("/stats", getStudentDashboardStats);

// Bulk questions upload endpoints (restricted to admin)
router.post("/admin/import-excel", adminMiddleware, upload.single("file"), importExcelQuestions);
router.post("/admin/import-pdf", adminMiddleware, upload.single("file"), importPdfQuestions);

export default router;
