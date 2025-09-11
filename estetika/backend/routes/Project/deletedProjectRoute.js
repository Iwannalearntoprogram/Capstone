const express = require("express");
const router = express.Router();
const DeletedProject = require("../../models/Project/DeletedProject");
const Project = require("../../models/Project/Project");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

// Middleware: Only allow admin
const requireAdmin = (req, res, next) => {
  if (req.role !== "admin") {
    return next(new AppError("Only admin can access recycle bin", 403));
  }
  next();
};

// Get all deleted projects (recycle bin)
router.get(
  "/",
  catchAsync(async (req, res, next) => {
    if (req.role !== "admin") {
      return next(new AppError("Only admin can access recycle bin", 403));
    }
    const deletedProjects = await DeletedProject.find().sort({ deletedAt: -1 });
    res.status(200).json({ deletedProjects });
  })
);

// Restore a deleted project
router.post(
  "/restore",
  requireAdmin,
  catchAsync(async (req, res, next) => {
    const { id } = req.body;
    const deleted = await DeletedProject.findById(id);
    if (!deleted) return next(new AppError("Deleted project not found", 404));
    // Restore project
    const restored = await Project.create(deleted.project);
    await DeletedProject.findByIdAndDelete(id);
    res.status(200).json({ message: "Project restored", restored });
  })
);

module.exports = router;
