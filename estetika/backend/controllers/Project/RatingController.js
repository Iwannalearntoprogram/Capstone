const Rating = require("../../models/Project/Rating");
const Project = require("../../models/Project/Project");
const User = require("../../models/User/User");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const mongoose = require("mongoose");

const rating_get = catchAsync(async (req, res, next) => {
  const { projectId, userId } = req.query;

  if (!projectId) {
    return next(new AppError("Project ID is required", 400));
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  let query = { project: projectId };
  if (userId) {
    query.user = userId;
  }

  const ratings = await Rating.find(query)
    .populate("user", "username email firstName lastName")
    .sort({ createdAt: -1 });

  const projectWithRatings = await Project.findById(projectId).select(
    "averageRating totalRatings"
  );

  return res.status(200).json({
    message: "Ratings retrieved successfully",
    ratings,
    statistics: {
      averageRating: projectWithRatings.averageRating,
      totalRatings: projectWithRatings.totalRatings,
    },
  });
});

// Create or update a rating
// Create or update a rating
const rating_post = catchAsync(async (req, res, next) => {
  const { projectId, rating, comment } = req.body;
  const userId = req.id;

  if (!projectId) {
    return next(new AppError("Project ID is required", 400));
  }

  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return next(new AppError("Rating must be an integer between 1 and 5", 400));
  }

  // Verify project exists and is completed
  const project = await Project.findById(projectId).populate(
    "members projectCreator"
  );
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  if (project.status !== "completed") {
    return next(
      new AppError("Ratings can only be submitted for completed projects", 400)
    );
  }

  const isProjectCreator = project.projectCreator._id.toString() === userId;

  if (!isProjectCreator) {
    return next(
      new AppError("Only project creators can rate their projects", 403)
    );
  }

  const existingRating = await Rating.findOne({
    project: projectId,
    user: userId,
  });

  if (existingRating) {
    return next(new AppError("You have already rated this project", 400));
  }

  const newRating = new Rating({
    project: projectId,
    user: userId,
    rating,
    comment,
  });
  const savedRating = await newRating.save();

  await savedRating.populate("user", "username email firstName lastName");

  return res.status(200).json({
    message: "Rating submitted successfully",
    rating: savedRating,
  });
});

const rating_put = catchAsync(async (req, res, next) => {
  return next(new AppError("Ratings cannot be updated once submitted", 400));
});

const rating_delete = catchAsync(async (req, res, next) => {
  const { ratingId } = req.query;
  const userId = req.id;
  const userRole = req.role;

  if (!ratingId) {
    return next(new AppError("Rating ID is required", 400));
  }

  const rating = await Rating.findById(ratingId);
  if (!rating) {
    return next(new AppError("Rating not found", 404));
  }

  if (rating.user.toString() !== userId && userRole !== "admin") {
    return next(new AppError("You can only delete your own rating", 403));
  }

  await Rating.findByIdAndDelete(ratingId);

  return res.status(200).json({
    message: "Rating deleted successfully",
  });
});

const rating_stats = catchAsync(async (req, res, next) => {
  const { projectId } = req.query;

  if (!projectId) {
    return next(new AppError("Project ID is required", 400));
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  const ratingBreakdown = await Rating.aggregate([
    { $match: { project: mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  ratingBreakdown.forEach((item) => {
    distribution[item._id] = item.count;
  });

  return res.status(200).json({
    message: "Rating statistics retrieved successfully",
    statistics: {
      averageRating: project.averageRating,
      totalRatings: project.totalRatings,
      distribution,
    },
  });
});

module.exports = {
  rating_get,
  rating_post,
  rating_put,
  rating_delete,
  rating_stats,
};
