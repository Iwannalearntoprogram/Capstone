const mongoose = require("mongoose");

const attributeRegistrySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    values: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AttributeRegistry", attributeRegistrySchema);
