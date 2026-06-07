import express from "express";
import { unlockAdmin } from "../controller/admin.js";

const router = express.Router();

// POST /api/admin/unlock
router.post("/unlock", unlockAdmin);

export default router;
