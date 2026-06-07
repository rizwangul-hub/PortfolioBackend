import jwt from "jsonwebtoken";

export const unlockAdmin = async (req, res) => {
  try {
    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({
        success: false,
        message: "Access code is required",
      });
    }

    const secretAdminCode = process.env.SECRET_ADMIN_CODE || "peral2426";

    if (accessCode !== secretAdminCode) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin access code",
      });
    }

    // Sign JWT token
    const token = jwt.sign(
      { isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

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
