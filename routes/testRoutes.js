import express from "express";

const router = express.Router();

// Simple health test endpoint
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Test route works" });
});

export default router;
