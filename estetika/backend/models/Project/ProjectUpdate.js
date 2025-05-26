const mongoose = require("mongoose");

const projectUpdateSchema = new mongoose.Schema(
  {
    description: String,
    imageLink: String,
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    designerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ProjectUpdate", projectUpdateSchema);
