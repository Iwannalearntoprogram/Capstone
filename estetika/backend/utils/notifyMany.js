const Notification = require("../models/utils/Notification");

/**
 * Upsert notifications for multiple recipients.
 * Each item: { recipient, type, message, project?, task?, phase?, event? }
 * Uniqueness enforced by existing partial indexes (recipient+task+type / recipient+phase+type).
 * For other notification types (updates, messages, etc.), we use insertOne to allow duplicates.
 * Duplicate key (11000) races are silently ignored.
 */
async function notifyMany(list = []) {
  if (!Array.isArray(list) || list.length === 0) return;

  const ops = list.map((n) => {
    // Only set task/phase/project/event when they actually have a value. Writing an explicit
    // `null` would make the field "exist" and pull the doc under the partial unique index
    // (see Notification.js), silently dropping legitimate notifications as duplicates.
    const fields = {};
    if (n.task) fields.task = n.task;
    if (n.phase) fields.phase = n.phase;
    if (n.project) fields.project = n.project;
    if (n.event) fields.event = n.event;

    // For task and phase notifications, use upsert to prevent duplicates
    if (n.task || n.phase) {
      return {
        updateOne: {
          filter: {
            recipient: n.recipient,
            type: n.type,
            ...(n.task ? { task: n.task } : {}),
            ...(n.phase ? { phase: n.phase } : {}),
          },
          update: {
            $setOnInsert: {
              message: n.message,
              read: false,
              ...fields,
            },
          },
          upsert: true,
        },
      };
    } else {
      // For general notifications (project updates, messages, etc.), use insertOne to create each one
      return {
        insertOne: {
          document: {
            recipient: n.recipient,
            type: n.type,
            message: n.message,
            read: false,
            ...fields,
          },
        },
      };
    }
  });

  try {
    const result = await Notification.bulkWrite(ops, { ordered: false });
    console.log(
      `✅ notifyMany: Created ${
        result.insertedCount || 0
      } notifications, Updated ${result.modifiedCount || 0} notifications`
    );
  } catch (e) {
    if (e && e.code === 11000) {
      console.log("⚠️ notifyMany: Duplicate key error (benign)");
      return;
    }
    console.error("❌ notifyMany error", e?.code || e?.message || e);
    // Don't throw, just log
  }
}

module.exports = notifyMany;
