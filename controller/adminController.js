import User from "../models/User.js";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import Result from "../models/Result.js";
import AdminSettings from "../models/AdminSettings.js";

// 1. GET SYSTEM STATISTICS
export const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    
    // Active users in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await User.countDocuments({ lastActive: { $gte: sevenDaysAgo } });

    const totalTests = await Test.countDocuments();
    const totalResults = await Result.countDocuments();
    
    // Simulated Revenue (e.g. tracking premium package conversions, mock number for UI wow factor)
    const simulatedRevenue = totalUsers * 5; // e.g. $5 per active student equivalent

    const settings = await AdminSettings.findOne();
    const activeAiProvider = settings ? settings.aiProvider : "gemini";

    return res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        activeUsers,
        blockedUsers,
        totalTests,
        totalResults,
        simulatedRevenue,
        activeAiProvider,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. GET USERS LIST
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password -refreshToken");
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. BLOCK/UNBLOCK USER
export const toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.isBlocked = !user.isBlocked;
    // Reset refresh token to kick them out if blocked
    if (user.isBlocked) {
      user.refreshToken = undefined;
    }
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User has been successfully ${user.isBlocked ? "blocked" : "unblocked"}.`,
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    // Delete their associated results
    await Result.deleteMany({ user: id });
    return res.status(200).json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. GET AI SETTINGS
export const getAiSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await AdminSettings.create({
        aiProvider: "gemini",
        openaiKey: "",
        geminiKey: "",
      });
    }

    // Mask keys for safety
    const maskedSettings = {
      aiProvider: settings.aiProvider,
      openaiKey: settings.openaiKey ? `••••••••••••${settings.openaiKey.slice(-4)}` : "",
      geminiKey: settings.geminiKey ? `••••••••••••${settings.geminiKey.slice(-4)}` : "",
    };

    return res.status(200).json({ success: true, settings: maskedSettings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. UPDATE AI SETTINGS
export const updateAiSettings = async (req, res) => {
  try {
    const { aiProvider, openaiKey, geminiKey } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    if (aiProvider) settings.aiProvider = aiProvider;
    
    // Only update keys if not masked format
    if (openaiKey && !openaiKey.includes("••••")) settings.openaiKey = openaiKey;
    if (geminiKey && !geminiKey.includes("••••")) settings.geminiKey = geminiKey;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "AI configuration updated successfully.",
      settings: {
        aiProvider: settings.aiProvider,
        openaiKey: settings.openaiKey ? `••••••••••••${settings.openaiKey.slice(-4)}` : "",
        geminiKey: settings.geminiKey ? `••••••••••••${settings.geminiKey.slice(-4)}` : "",
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. CREATE QUESTION
export const createQuestion = async (req, res) => {
  try {
    const { statement, options, correctAnswer, category, difficulty, examType, explanation } = req.body;
    
    if (!statement || !options || options.length !== 4 || !correctAnswer || !category || !examType) {
      return res.status(400).json({ success: false, message: "Missing or invalid question details." });
    }

    const question = await Question.create({
      statement,
      options,
      correctAnswer,
      category,
      difficulty,
      examType,
      explanation,
    });

    return res.status(201).json({ success: true, message: "Question created successfully.", question });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. DELETE QUESTION
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found." });
    }
    return res.status(200).json({ success: true, message: "Question deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
