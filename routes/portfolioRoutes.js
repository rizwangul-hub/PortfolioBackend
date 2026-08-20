import express from "express";
import {
  getPortfolioData,
  updateProfile,
  createSkill,
  updateSkill,
  deleteSkill,
  createAITool,
  updateAITool,
  deleteAITool,
  createService,
  updateService,
  deleteService,
} from "../controller/portfolioController.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// Public route to get all portfolio items
router.get("/", getPortfolioData);

// Protected Admin Routes
router.post(
  "/profile",
  authMiddleware,
  adminMiddleware,
  upload.fields([
    { name: "heroImage", maxCount: 1 },
    { name: "aboutImage", maxCount: 1 },
  ]),
  updateProfile,
);

// Skills
router.post("/skills", authMiddleware, adminMiddleware, createSkill);
router.put("/skills/:id", authMiddleware, adminMiddleware, updateSkill);
router.delete("/skills/:id", authMiddleware, adminMiddleware, deleteSkill);

// AI Tools
router.post("/ai-tools", authMiddleware, adminMiddleware, createAITool);
router.put("/ai-tools/:id", authMiddleware, adminMiddleware, updateAITool);
router.delete("/ai-tools/:id", authMiddleware, adminMiddleware, deleteAITool);

// Services
router.post("/services", authMiddleware, adminMiddleware, createService);
router.put("/services/:id", authMiddleware, adminMiddleware, updateService);
router.delete("/services/:id", authMiddleware, adminMiddleware, deleteService);

export default router;
