const Notification = require("../models/utils/Notification");

/**
 * Upsert notifications for multiple recipients.
 * Each item: { recipient, type, message, project?, task?, phase?, event? }
 * Uniqueness enforced by existing partial indexes (recipient+task+type / recipient+phase+type).
 * Duplicate key (11000) races are silently ignored.
 */
async function notifyMany(list = []) {
  if (!Array.isArray(list) || list.length === 0) return;

  const ops = list.map((n) => ({
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
  }));

  try {
    await Notification.bulkWrite(ops, { ordered: false });
  } catch (e) {
    if (e && e.code === 11000) return; // benign
    console.error("notifyMany error", e?.code || e?.message || e);
  }
}

module.exports = notifyMany;
