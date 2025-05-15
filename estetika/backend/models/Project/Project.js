const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Sub phase title is required"],
    },
    description: String,
    budget: String,
    startDate: Date,
    endDate: Date,
    members: { type: [mongoose.Schema.Types.ObjectId], ref: "User" },
    projectCreator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tasks: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    progress: { type: mongoose.Schema.Types.ObjectId, ref: "Progress" },
    timeline: { type: [mongoose.Schema.Types.ObjectId], ref: "Phases" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);
