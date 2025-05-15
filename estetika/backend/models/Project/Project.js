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
    tasks: { type: [mongoose.Schema.Types.ObjectId], ref: "Task" },
    timeline: { type: [mongoose.Schema.Types.ObjectId], ref: "Phase" },
    projectCreator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);
