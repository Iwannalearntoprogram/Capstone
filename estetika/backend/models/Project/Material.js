const mongoose = require("mongoose");
const { normalizeAttributeTags } = require("../../utils/attributeTags");

const ROOM_TYPE_OPTIONS = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Home Office",
  "Dining Room",
  "Whole House",
  "Commercial Space",
];

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
    roomType: {
      type: String,
      required: [true, "Room type is required"],
      enum: ROOM_TYPE_OPTIONS,
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
    attributes: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
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

function normalizeRoomType(value) {
  const normalized = toTitleCase(value);
  if (!normalized) return normalized;

  const aliases = {
    "Bed Room": "Bedroom",
    "Dining Area": "Dining Room",
    Office: "Home Office",
  };

  return aliases[normalized] || normalized;
}

// Normalize room metadata before validation/save.
materialSchema.pre("validate", function (next) {
  if (this.isModified("category") && this.category) {
    this.category = toTitleCase(this.category);
  }
  if (this.isModified("subCategory") && this.subCategory) {
    this.subCategory = toTitleCase(this.subCategory);
  }
  if (this.isModified("roomType") && this.roomType) {
    this.roomType = normalizeRoomType(this.roomType);
  }
  this.attributes = normalizeAttributeTags(this.attributes);
  next();
});

// For findOneAndUpdate / updateOne / updateMany style operations.
function normalizeUpdate(update) {
  if (!update) return;
  // Support both direct set and $set usage
  const target = update.$set ? update.$set : update;
  if (target.category) target.category = toTitleCase(target.category);
  if (target.subCategory) target.subCategory = toTitleCase(target.subCategory);
  if (target.roomType) target.roomType = normalizeRoomType(target.roomType);
  if (target.attributes !== undefined) {
    target.attributes = normalizeAttributeTags(target.attributes);
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
      if (d.roomType) d.roomType = normalizeRoomType(d.roomType);
      if (d.attributes !== undefined) {
        d.attributes = normalizeAttributeTags(d.attributes);
      }
    });
  }
  next();
});

module.exports = mongoose.model("Material", materialSchema);
