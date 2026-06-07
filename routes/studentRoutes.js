import express from "express";
import {
  getStudyPlan,
  toggleStudyPlanTask,
  getNotifications,
  markNotificationRead,
  getCertificates,
  verifyCertificate,
  chatWithBuddy,
} from "../controller/studentController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public certificate validation
router.get("/certificates/verify/:code", verifyCertificate);

// Protected routes (require auth)
router.get("/study-plan", authMiddleware, getStudyPlan);
router.post("/study-plan/toggle", authMiddleware, toggleStudyPlanTask);
router.get("/notifications", authMiddleware, getNotifications);
router.put("/notifications/:id/read", authMiddleware, markNotificationRead);
router.get("/certificates", authMiddleware, getCertificates);
router.post("/chat", authMiddleware, chatWithBuddy);

export default router;
