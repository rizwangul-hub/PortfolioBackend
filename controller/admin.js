import jwt from "jsonwebtoken";

export const unlockAdmin = async (req, res) => {
  try {
    const accessCode = String(req.body?.accessCode || "").trim();

    if (!accessCode) {
      return res.status(400).json({
        success: false,
        message: "Access code is required",
      });
    }

    const secretAdminCode = String(process.env.SECRET_ADMIN_CODE || "").trim();
    if (!secretAdminCode) {
      console.error("SECRET_ADMIN_CODE is not configured.");
      return res.status(500).json({
        success: false,
        message: "Admin access is not configured.",
      });
    }

    if (accessCode !== secretAdminCode) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin access code",
      });
    }

    const jwtSecret = String(process.env.JWT_SECRET || "").trim();
    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured.");
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured correctly.",
      });
    }

    const tokenPayload = {
      id: String(process.env.ADMIN_USER_ID || "admin").trim() || "admin",
      role: "admin",
      email: String(process.env.ADMIN_EMAIL || "admin@portfolio.local").trim(),
      isAdmin: true,
    };

    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: "24h",
    });

    return res.status(200).json({
      success: true,
      message: "Admin mode unlocked successfully",
      token,
    });
  } catch (error) {
    console.error("Error in unlockAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during unlock",
    });
  }
};
