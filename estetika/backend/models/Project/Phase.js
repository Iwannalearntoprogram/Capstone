const mongoose = require("mongoose");

const phaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Phase title is required"],
    },

    startDate: Date,
    endDate: Date,
    subPhaseId: { type: [mongoose.Schema.Types.ObjectId], ref: "SubPhase" },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    progress: Number,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Phase", phaseSchema);
