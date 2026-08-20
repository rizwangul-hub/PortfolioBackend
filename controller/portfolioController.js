import { Skill } from "../models/Skill.js";
import { AITool } from "../models/AITool.js";
import { Service } from "../models/Service.js";
import { PortfolioProfile } from "../models/PortfolioProfile.js";
import { Project } from "../models/Project.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

// GET Portfolio Data (Profile, Skills, AI Tools, Services, Total Projects Count)
export const getPortfolioData = async (req, res) => {
  try {
    const skills = await Skill.find().sort({ createdAt: 1 });
    const aiTools = await AITool.find().sort({ createdAt: 1 });
    const services = await Service.find().sort({ createdAt: 1 });
    let profile = await PortfolioProfile.findOne();

    if (!profile) {
      profile = await PortfolioProfile.create({});
    }

    const totalProjects = await Project.countDocuments();

    return res.status(200).json({
      success: true,
      data: {
        profile,
        skills,
        aiTools,
        services,
        totalProjects,
      },
    });
  } catch (error) {
    console.error("Get Portfolio Data Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch portfolio data",
    });
  }
};

// UPDATE Profile (Images and Text)
export const updateProfile = async (req, res) => {
  try {
    let profile = await PortfolioProfile.findOne();
    if (!profile) {
      profile = new PortfolioProfile({});
    }

    if (req.files?.heroImage?.[0]) {
      const heroUrl = await uploadToCloudinary(req.files.heroImage[0].buffer);
      profile.heroImage = heroUrl;
    }

    if (req.files?.aboutImage?.[0]) {
      const aboutUrl = await uploadToCloudinary(req.files.aboutImage[0].buffer);
      profile.aboutImage = aboutUrl;
    }

    if (req.body.yearsExperience !== undefined) {
      profile.yearsExperience = req.body.yearsExperience;
    }
    if (req.body.passion !== undefined) {
      profile.passion = req.body.passion;
    }
    if (req.body.aboutTitle !== undefined) {
      profile.aboutTitle = req.body.aboutTitle;
    }
    if (req.body.aboutDescription !== undefined) {
      profile.aboutDescription = req.body.aboutDescription;
    }
    if (req.body.customProjectsCount !== undefined) {
      profile.customProjectsCount = req.body.customProjectsCount
        ? Number(req.body.customProjectsCount)
        : null;
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

// SKILLS CRUD
export const createSkill = async (req, res) => {
  try {
    const { category, technologies, iconName } = req.body;
    if (!category) {
      return res.status(400).json({ success: false, message: "Category is required." });
    }

    const techArray = Array.isArray(technologies)
      ? technologies
      : typeof technologies === "string"
      ? technologies.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const skill = await Skill.create({
      category,
      technologies: techArray,
      iconName: iconName || "Atom",
    });

    return res.status(201).json({ success: true, message: "Skill created.", data: skill });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, technologies, iconName } = req.body;

    const updates = {};
    if (category !== undefined) updates.category = category;
    if (iconName !== undefined) updates.iconName = iconName;
    if (technologies !== undefined) {
      updates.technologies = Array.isArray(technologies)
        ? technologies
        : typeof technologies === "string"
        ? technologies.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
    }

    const skill = await Skill.findByIdAndUpdate(id, updates, { new: true });
    if (!skill) {
      return res.status(404).json({ success: false, message: "Skill not found." });
    }

    return res.status(200).json({ success: true, message: "Skill updated.", data: skill });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const skill = await Skill.findByIdAndDelete(id);
    if (!skill) {
      return res.status(404).json({ success: false, message: "Skill not found." });
    }
    return res.status(200).json({ success: true, message: "Skill deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// AI TOOLS CRUD
export const createAITool = async (req, res) => {
  try {
    const { title, subtitle, features, accent, iconName } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required." });
    }

    const featArray = Array.isArray(features)
      ? features
      : typeof features === "string"
      ? features.split("\n").map((f) => f.trim()).filter(Boolean)
      : [];

    const tool = await AITool.create({
      title,
      subtitle: subtitle || "",
      features: featArray,
      accent: accent || "from-cyan-400 to-blue-500",
      iconName: iconName || "FaRobot",
    });

    return res.status(201).json({ success: true, message: "AI Tool created.", data: tool });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAITool = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, features, accent, iconName } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (subtitle !== undefined) updates.subtitle = subtitle;
    if (accent !== undefined) updates.accent = accent;
    if (iconName !== undefined) updates.iconName = iconName;
    if (features !== undefined) {
      updates.features = Array.isArray(features)
        ? features
        : typeof features === "string"
        ? features.split("\n").map((f) => f.trim()).filter(Boolean)
        : [];
    }

    const tool = await AITool.findByIdAndUpdate(id, updates, { new: true });
    if (!tool) {
      return res.status(404).json({ success: false, message: "AI Tool not found." });
    }

    return res.status(200).json({ success: true, message: "AI Tool updated.", data: tool });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAITool = async (req, res) => {
  try {
    const { id } = req.params;
    const tool = await AITool.findByIdAndDelete(id);
    if (!tool) {
      return res.status(404).json({ success: false, message: "AI Tool not found." });
    }
    return res.status(200).json({ success: true, message: "AI Tool deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// SERVICES CRUD
export const createService = async (req, res) => {
  try {
    const { title, description, techStack, iconName } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required." });
    }

    const techArray = Array.isArray(techStack)
      ? techStack
      : typeof techStack === "string"
      ? techStack.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const service = await Service.create({
      title,
      description,
      techStack: techArray,
      iconName: iconName || "Globe",
    });

    return res.status(201).json({ success: true, message: "Service created.", data: service });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, techStack, iconName } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (iconName !== undefined) updates.iconName = iconName;
    if (techStack !== undefined) {
      updates.techStack = Array.isArray(techStack)
        ? techStack
        : typeof techStack === "string"
        ? techStack.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
    }

    const service = await Service.findByIdAndUpdate(id, updates, { new: true });
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    return res.status(200).json({ success: true, message: "Service updated.", data: service });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }
    return res.status(200).json({ success: true, message: "Service deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
