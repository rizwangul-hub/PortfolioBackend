import mongoose from "mongoose";
import { Project } from "../models/project.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

// Create Project
export const projectCreate = async (req, res) => {
  try {
    const { title, description, liveLink, githubLink, technologies } = req.body;

    if (!title || !description || !liveLink) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and live demo link are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Project image is required",
      });
    }

    const existingProject = await Project.findOne({
      title,
      user: req.user._id,
    });

    if (existingProject) {
      return res.status(409).json({
        success: false,
        message: "You already have a project with this title",
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
      user: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Projects
export const allProjects = async (req, res) => {
  try {
    const sortOption =
      req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

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
      data: projects,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Project
export const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Project ID",
      });
    }

    const project = await Project.findOneAndDelete({
      _id: projectId,
      user: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Project
export const singleProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({
      _id: id,
      user: req.user._id,
    }).select("-__v");
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    return res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
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
      { _id: id, user: req.user._id },
      updates,
      { new: true, runValidators: true },
    ).select("-__v");

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
