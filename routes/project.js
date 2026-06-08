import express from "express";
import {
  projectCreate,
  getAllProjects,
  singleProject,
  updateProject,
  deleteProject,
} from "../controller/project.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// Public routes
router.get("/", getAllProjects);
router.get("/:id", singleProject);

// Protected admin routes
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  projectCreate,
);
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  updateProject,
);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProject);

export default router;
