const mongoose = require("mongoose");

const categoryTemplateSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, unique: true },
    attributes: [{ key: { type: String, required: true } }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("CategoryTemplate", categoryTemplateSchema);
