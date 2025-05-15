const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
    },
    description: String,
    status: {
      type: String,
      enum: ["backlog", "in-progress", "completed"],
      default: "backlog",
    },
    startDate: Date,
    endDate: Date,
    assigned: { type: [mongoose.Schema.Types.ObjectId], ref: "User" },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);
