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
// where one of the fields was missing. We use partial indexes so uniqueness only applies when
// the indexed field holds a real ObjectId.
//
// IMPORTANT: the filter MUST be `$type: "objectId"`, NOT `$exists: true`. In MongoDB a field
// explicitly set to `null` still "exists", so `$exists: true` made the unique constraint apply
// to every notification (we used to write `task: null` / `phase: null`). That silently dropped
// any second notification of the same type for a recipient — e.g. two task assignments collided
// on (recipient, phase: null, type) — surfacing as "Duplicate key error (benign)" in logs and
// notifications that never appeared. `$type: "objectId"` excludes null/absent values entirely.
//
// IMPORTANT: changing index OPTIONS does not update indexes already built in an existing
// database. fixNotificationIndexes() (run on server startup) drops the stale indexes so these
// definitions get rebuilt.
notificationSchema.index(
  { recipient: 1, task: 1, type: 1 },
  { unique: true, partialFilterExpression: { task: { $type: "objectId" } } }
);
notificationSchema.index(
  { recipient: 1, phase: 1, type: 1 },
  { unique: true, partialFilterExpression: { phase: { $type: "objectId" } } }
);

module.exports = mongoose.model("Notification", notificationSchema);
