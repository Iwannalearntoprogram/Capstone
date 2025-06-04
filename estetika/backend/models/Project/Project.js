const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
    },
    description: String,
    budget: Number,
    startDate: Date,
    endDate: Date,
    files: [String],
    members: { type: [mongoose.Schema.Types.ObjectId], ref: "User" },
    tasks: { type: [mongoose.Schema.Types.ObjectId], ref: "Task" },
    timeline: { type: [mongoose.Schema.Types.ObjectId], ref: "Phase" },
    projectCreator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "ongoing", "completed", "cancelled"],
      default: "pending",
    },
    roomType: {
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
    projectSize: Number,
    projectLocation: String,
    designPreference: String,
    designInspiration: String,
    designRecommendation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DesignRecommendation",
    },
    projectUpdates: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "ProjectUpdate",
    },
    materials: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Material",
          required: true,
        },
        option: [
          {
            type: {
              type: String,
              required: true,
              enum: ["color", "type", "size"],
            },
            option: {
              type: String,
              required: true,
            },
            addToPrice: {
              type: Number,
              required: true,
            },
          },
        ],
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"],
        },
        totalPrice: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);
