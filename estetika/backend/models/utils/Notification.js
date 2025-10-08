const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: String,
    type: {
      type: String,
      required: true,
      enum: [
        "assigned",
        "overdue",
        "phase-started",
        "phase-completed",
        "alarm",
        "update",
        "project-approved",
      ],
    },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    phase: { type: mongoose.Schema.Types.ObjectId, ref: "Phase" },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
// Previous implementation enforced uniqueness on (recipient, task, type) and (recipient, phase, type)
// even when task or phase were null, causing duplicate key errors on sequential creations
// where one of the fields was missing. We switch to partial indexes so uniqueness only
// applies when the indexed field exists. This lets us safely store different notification
// types that don't always relate to a task or a phase without collisions.
// IMPORTANT: A migration step should drop the old indexes in existing databases.
notificationSchema.index(
  { recipient: 1, task: 1, type: 1 },
  { unique: true, partialFilterExpression: { task: { $exists: true } } }
);
notificationSchema.index(
  { recipient: 1, phase: 1, type: 1 },
  { unique: true, partialFilterExpression: { phase: { $exists: true } } }
);

module.exports = mongoose.model("Notification", notificationSchema);
