import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import axios from "axios";

// Helper to generate tokens
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, desiredExam: user.desiredExam },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Mail sending helper
const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.mailtrap.io",
      port: process.env.SMTP_PORT || 2525,
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });

    const info = await transporter.sendMail({
      from: `"SmartPrep AI" <noreply@smartprepai.com>`,
      to,
      subject,
      text,
      html,
    });

    console.log("✉️ Email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error sending email, fallback logging to console:");
    console.log(`========================================`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${text}`);
    console.log(`========================================`);
    return false;
  }
};

// 1. REGISTER
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, gender, educationLevel, city, desiredExam } = req.body;

    if (!name || !email || !password || !desiredExam) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email is already registered." });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      gender,
      educationLevel,
      city,
      desiredExam,
      verificationToken,
      isVerified: false,
    });

    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;
    const mailText = `Welcome to SmartPrep AI! Please verify your email by clicking: ${verifyUrl}`;
    const mailHtml = `
      <h3>Welcome to SmartPrep AI, ${name}!</h3>
      <p>Please verify your email address to unlock AI Mock Exams:</p>
      <a href="${verifyUrl}" style="padding: 10px 20px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
    `;

    await sendEmail(email, "Verify Your SmartPrep AI Account", mailText, mailHtml);

    return res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials." });
    }

    if (!user.isVerified) {
      return res.status(400).json({ success: false, message: "Please verify your email before logging in." });
    }

    // Update streak tracking on successful login
    const today = new Date().toDateString();
    const lastActiveDate = user.lastActive ? user.lastActive.toDateString() : null;

    if (lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastActiveDate === yesterday.toDateString()) {
        user.streak += 1;
      } else {
        user.streak = 1;
      }
      user.lastActive = new Date();
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        desiredExam: user.desiredExam,
        profileImage: user.profileImage,
        gender: user.gender,
        educationLevel: user.educationLevel,
        city: user.city,
        role: user.role,
        streak: user.streak,
        badges: user.badges,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. GOOGLE LOGIN
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body; // Firebase / Client-side Google ID Token
    if (!credential) {
      return res.status(400).json({ success: false, message: "Google ID Token is missing." });
    }

    let payload;
    try {
      // Direct call to Google OAuth endpoint to verify token validity
      const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      payload = response.data;
    } catch (err) {
      return res.status(400).json({ success: false, message: "Google verification failed or expired." });
    }

    const { email, name, picture, sub: googleId } = payload;
    if (!email) {
      return res.status(400).json({ success: false, message: "No email associated with Google Account." });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // Create user if not existing. Assign default required parameters.
      user = await User.create({
        name,
        email,
        googleId,
        profileImage: picture || undefined,
        desiredExam: "PMA Long Course", // default, user can update in profile
        isVerified: true,
      });
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true;
        await user.save();
      }
    }

    // Streak tracker
    const today = new Date().toDateString();
    const lastActiveDate = user.lastActive ? user.lastActive.toDateString() : null;

    if (lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastActiveDate === yesterday.toDateString()) {
        user.streak += 1;
      } else {
        user.streak = 1;
      }
      user.lastActive = new Date();
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        desiredExam: user.desiredExam,
        profileImage: user.profileImage,
        gender: user.gender,
        educationLevel: user.educationLevel,
        city: user.city,
        role: user.role,
        streak: user.streak,
        badges: user.badges,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. EMAIL VERIFY
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required." });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification token." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. REFRESH TOKEN
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token is required." });
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid refresh token." });
    }

    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: "Refresh token has expired." });
      }

      const accessToken = generateAccessToken(user);
      return res.status(200).json({ success: true, accessToken });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
    const mailText = `Reset your password by clicking: ${resetUrl}`;
    const mailHtml = `
      <h3>Reset Password Request</h3>
      <p>You requested a password reset. Click below to choose a new password (valid for 1 hour):</p>
      <a href="${resetUrl}" style="padding: 10px 20px; background-color: #ef4444; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
    `;

    await sendEmail(email, "Reset Your SmartPrep AI Password", mailText, mailHtml);

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Token is invalid or expired." });
    }

    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful! You can now log in.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
