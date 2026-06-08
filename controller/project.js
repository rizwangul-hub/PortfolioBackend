import mongoose from "mongoose";
import { Project } from "../models/project.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

export const projectCreate = async (req, res) => {
  try {
    const { title, description, liveLink, githubLink, technologies } = req.body;

    if (!title || !description || !liveLink) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and liveLink are required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Project image is required.",
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const existingProject = await Project.findOne({
      title,
      user: req.user.id,
    });

    if (existingProject) {
      return res.status(409).json({
        success: false,
        message: "A project with this title already exists.",
      });
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer);

    const techArray = technologies
      ? technologies
          .split(",")
          .map((tech) => tech.trim())
          .filter(Boolean)
      : [];

    const project = await Project.create({
      title,
      description,
      image: imageUrl,
      liveLink,
      githubLink: githubLink || "",
      technologies: techArray,
      user: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: project,
    });
  } catch (error) {
    console.error("Create Project Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const sortOption =
      req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const total = await Project.countDocuments();
    const projects = await Project.find()
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .select("-__v");

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      pagination: {
        totalPages: Math.max(Math.ceil(total / limit), 1),
        page,
      },
      data: projects,
    });
  } catch (error) {
    console.error("Get Projects Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const singleProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Project ID.",
      });
    }

    const project = await Project.findById(id).select("-__v");
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Get Single Project Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Project ID.",
      });
    }

    const updates = { ...req.body };
    if (req.file) {
      updates.image = await uploadToCloudinary(req.file.buffer);
    }

    if (updates.technologies && typeof updates.technologies === "string") {
      updates.technologies = updates.technologies
        .split(",")
        .map((tech) => tech.trim())
        .filter(Boolean);
    }

    const project = await Project.findOneAndUpdate(
      { _id: id, user: req.user.id },
      updates,
      { new: true, runValidators: true },
    ).select("-__v");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: project,
    });
  } catch (error) {
    console.error("Update Project Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Project ID.",
      });
    }

    const project = await Project.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Project Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
