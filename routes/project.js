import express from "express";
import {
  projectCreate,
  allProjects,
  singleProject,
  updateProject,
  deleteProject,
} from "../controller/project.js";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// Public routes
router.get("/", allProjects);
router.get("/:id", singleProject);

// Protected admin routes
router.post("/", authMiddleware, upload.single("image"), projectCreate);
router.put("/:id", authMiddleware, upload.single("image"), updateProject);
router.delete("/:id", authMiddleware, deleteProject);

export default router;
