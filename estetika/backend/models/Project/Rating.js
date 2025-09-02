const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1 star"],
      max: [5, "Rating cannot exceed 5 stars"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number",
      },
    },
    comment: {
      type: String,
      maxlength: [500, "Comment cannot exceed 500 characters"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one rating per user per project
ratingSchema.index({ project: 1, user: 1 }, { unique: true });

// Static method to calculate average rating for a project
ratingSchema.statics.calcAverageRating = async function (projectId) {
  const stats = await this.aggregate([
    {
      $match: { project: projectId },
    },
    {
      $group: {
        _id: "$project",
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await this.model("Project").findByIdAndUpdate(projectId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal place
      totalRatings: stats[0].totalRatings,
    });
  } else {
    await this.model("Project").findByIdAndUpdate(projectId, {
      averageRating: 0,
      totalRatings: 0,
    });
  }
};

// Middleware to update project rating stats after save
ratingSchema.post("save", function () {
  this.constructor.calcAverageRating(this.project);
});

// Middleware to update project rating stats after remove
ratingSchema.post("remove", function () {
  this.constructor.calcAverageRating(this.project);
});

// Middleware to update project rating stats after findOneAndDelete
ratingSchema.post("findOneAndDelete", function (doc) {
  if (doc) {
    this.constructor.calcAverageRating(doc.project);
  }
});

module.exports = mongoose.model("Rating", ratingSchema);
