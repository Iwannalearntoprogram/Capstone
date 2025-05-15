const mongoose = require("mongoose");

const subPhaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Material name is required"],
    },
    status: {
      type: String,
      enum: ["backlog", "in-progress", "completed"],
      default: "backlog",
    },
    startDate: Date,
    endDate: Date,
    phaseId: { type: [mongoose.Schema.Types.ObjectId], ref: "Phase" },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SubPhase", subPhaseSchema);
