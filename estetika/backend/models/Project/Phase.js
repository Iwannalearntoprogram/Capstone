const mongoose = require("mongoose");

const phaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Phase title is required"],
    },
    startDate: Date,
    endDate: Date,
    tasks: { type: [mongoose.Schema.Types.ObjectId], ref: "Task" },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    progress: Number,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notified: {
      type: Boolean,
      default: false,
    },
    completionNotified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Phase", phaseSchema);
