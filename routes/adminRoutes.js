import express from "express";
import {
  getAnalytics,
  getUsers,
  toggleBlockUser,
  deleteUser,
  getAiSettings,
  updateAiSettings,
  createQuestion,
  deleteQuestion,
} from "../controller/adminController.js";
import { unlockAdmin } from "../controller/admin.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public admin routes
router.post("/unlock", unlockAdmin);

// Apply auth and admin checks globally to this router
router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/analytics", getAnalytics);
router.get("/users", getUsers);
router.put("/users/:id/block", toggleBlockUser);
router.delete("/users/:id", deleteUser);

router.get("/ai-settings", getAiSettings);
router.post("/ai-settings", updateAiSettings);

router.post("/question", createQuestion);
router.delete("/question/:id", deleteQuestion);

export default router;
