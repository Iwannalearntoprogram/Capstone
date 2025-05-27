const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      required: true,
    },
    message: String,
    type: {
      type: String,
      required: true,
      enum: ["assigned", "overdue", "phase-started", "alarm", "update"],
    },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    phase: { type: mongoose.Schema.Types.ObjectId, ref: "Phase" },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// index
notificationSchema.index({ recipient: 1, task: 1, type: 1 }, { unique: true });
notificationSchema.index({ recipient: 1, phase: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Notification", notificationSchema);
