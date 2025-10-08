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
              project: n.project || null,
              task: n.task || null,
              phase: n.phase || null,
              event: n.event || null,
              read: false,
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
            project: n.project || null,
            task: n.task || null,
            phase: n.phase || null,
            event: n.event || null,
            read: false,
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
