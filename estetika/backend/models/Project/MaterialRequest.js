const mongoose = require("mongoose");
const { normalizeAttributeTags } = require("../../utils/attributeTags");

const materialRequestSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: { type: String, required: true },
    attributes: { type: [mongoose.Schema.Types.Mixed], default: [] },
    budgetMax: { type: Number },
    notes: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
    // Linkage and audit fields
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      default: null,
    },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    declinedAt: { type: Date },
    declinedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

materialRequestSchema.pre("validate", function (next) {
  this.attributes = normalizeAttributeTags(this.attributes);
  next();
});

materialRequestSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  const target = update?.$set ? update.$set : update;
  if (target?.attributes !== undefined) {
    target.attributes = normalizeAttributeTags(target.attributes);
  }
  next();
});

module.exports = mongoose.model("MaterialRequest", materialRequestSchema);
