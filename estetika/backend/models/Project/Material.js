const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Material name is required"],
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
    },
    price: {
      type: Number,
      required: [true, "Material price name is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    image: {
      type: [String],
      required: [true, "Material image is required"],
    },
    options: {
      type: [String],
      required: [true, "Material options are required"],
    },
    category: {
      type: String,
      required: [true, "Material category is required"],
    },
    designerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Material", materialSchema);
