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
    designInspo: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);
