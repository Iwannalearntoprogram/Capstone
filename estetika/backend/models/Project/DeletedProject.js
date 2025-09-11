const mongoose = require("mongoose");

const DeletedProjectSchema = new mongoose.Schema({
  project: { type: Object, required: true }, // Store the full project object
  deletedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DeletedProject", DeletedProjectSchema);
