import express from "express";
import {
  register,
  login,
  googleLogin,
  verifyEmail,
  refresh,
  forgotPassword,
  resetPassword,
} from "../controller/authController.js";
import { authMiddleware } from "../middleware/auth.js";
import User from "../models/User.js";
import { authLimiter } from "../middleware/security.js";

const router = express.Router();

// Apply strict rate limiting on registration and logins
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleLogin);
router.post("/verify-email", verifyEmail);
router.post("/refresh", refresh);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Profile Fetching & Updating Endpoint
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update Profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, gender, educationLevel, city, desiredExam } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (educationLevel) user.educationLevel = educationLevel;
    if (city) user.city = city;
    if (desiredExam) user.desiredExam = desiredExam;

    await user.save();
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
