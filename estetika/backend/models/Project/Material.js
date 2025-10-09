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
    attributes: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Helper to Title Case a string while trimming extra spaces.
function toTitleCase(str) {
  if (!str || typeof str !== "string") return str;
  return str
    .trim()
    .replace(/\s+/g, " ") // collapse multiple spaces
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Normalize category & subCategory before validation/save.
materialSchema.pre("save", function (next) {
  if (this.isModified("category") && this.category) {
    this.category = toTitleCase(this.category);
  }
  if (this.isModified("subCategory") && this.subCategory) {
    this.subCategory = toTitleCase(this.subCategory);
  }
  if (Array.isArray(this.attributes)) {
    this.attributes = this.attributes
      .filter((a) => a && a.key && a.value)
      .map((a) => ({
        key: toTitleCase(a.key),
        value: a.value.toString().trim(),
      }));
  }
  next();
});

// For findOneAndUpdate / updateOne / updateMany style operations.
function normalizeUpdate(update) {
  if (!update) return;
  // Support both direct set and $set usage
  const target = update.$set ? update.$set : update;
  if (target.category) target.category = toTitleCase(target.category);
  if (target.subCategory) target.subCategory = toTitleCase(target.subCategory);
  if (Array.isArray(target.attributes)) {
    target.attributes = target.attributes
      .filter((a) => a && a.key && a.value)
      .map((a) => ({
        key: toTitleCase(a.key),
        value: a.value.toString().trim(),
      }));
  }
}

materialSchema.pre(
  [
    "findOneAndUpdate",
    "updateOne",
    "updateMany",
    "findMany",
    "findByIdAndUpdate",
  ],
  function (next) {
    normalizeUpdate(this.getUpdate());
    next();
  }
);

materialSchema.pre("insertMany", function (next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach((d) => {
      if (d.category) d.category = toTitleCase(d.category);
      if (d.subCategory) d.subCategory = toTitleCase(d.subCategory);
    });
  }
  next();
});

module.exports = mongoose.model("Material", materialSchema);
