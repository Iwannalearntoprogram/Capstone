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
      default: [],
    },
    options: [
      {
        type: {
          type: String,
          required: true,
          enum: ["color", "type", "size"],
        },
        option: {
          type: String,
          required: true,
        },
        addToPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    category: {
      type: String,
      required: [true, "Material category is required"],
    },
    subCategory: {
      type: String,
    },
    sales: {
      type: Number,
      default: 0,
    },
    designerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    embedding: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Material", materialSchema);
