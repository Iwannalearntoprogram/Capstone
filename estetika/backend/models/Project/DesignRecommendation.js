const mongoose = require("mongoose");

const designRecommendationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Design Recommendation title is required"],
    },
    imageLink: String,
    specification: String,
    budgetRange: {
      min: {
        type: Number,
        required: [true, "Minimum budget is required"],
      },
      max: {
        type: Number,
        required: [true, "Maximum budget is required"],
      },
    },
    designPreferences: {
      type: [String],
    },
    type: {
      type: String,
      enum: [
        "Living Room",
        "Bedroom",
        "Kitchen",
        "Bathroom",
        "Home Office",
        "Dining Room",
        "Whole House",
        "Commercial Space",
      ],
      default: "Living Room",
    },
    popularity: {
      type: Number,
      default: 0,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DesignRecommendation",
  designRecommendationSchema
);
