const Notification = require("../models/utils/Notification");

/**
 * One-shot index migration for the notifications collection.
 *
 * The unique indexes on (recipient, task, type) and (recipient, phase, type) were originally
 * built either as plain unique indexes or with a `{ $exists: true }` partial filter. Both
 * variants treat a `null` task/phase as a real value, so they wrongly enforced uniqueness on
 * almost every notification and silently rejected legitimate ones (logged as
 * "Duplicate key error (benign)").
 *
 * Changing the index definition in the schema does NOT alter an index that already exists in
 * the database — Mongoose will not drop/recreate an index whose key matches but whose options
 * differ. So on startup we drop any stale index on those key patterns and let syncIndexes()
 * rebuild them from the corrected schema definition (partialFilterExpression: $type "objectId").
 */
async function fixNotificationIndexes() {
  try {
    const collection = Notification.collection;
    const indexes = await collection.indexes();

    // Key signatures of the indexes we manage. We drop any existing index whose key matches one
    // of these so the corrected definition from the schema can be rebuilt cleanly.
    const managedKeys = [
      JSON.stringify({ recipient: 1, task: 1, type: 1 }),
      JSON.stringify({ recipient: 1, phase: 1, type: 1 }),
    ];

    for (const idx of indexes) {
      if (idx.name === "_id_") continue;

      const keySig = JSON.stringify(idx.key);
      if (!managedKeys.includes(keySig)) continue;

      // Only drop if it's stale: missing a partial filter, or using the broken $exists filter.
      const pfe = idx.partialFilterExpression;
      const isCorrect =
        pfe &&
        (JSON.stringify(pfe) ===
          JSON.stringify({ task: { $type: "objectId" } }) ||
          JSON.stringify(pfe) ===
            JSON.stringify({ phase: { $type: "objectId" } }));

      if (!isCorrect) {
        await collection.dropIndex(idx.name);
        console.log(`🧹 fixNotificationIndexes: dropped stale index "${idx.name}"`);
      }
    }

    // Rebuild any missing indexes (and drop any leftover ones not in the schema) from the model.
    await Notification.syncIndexes();
    console.log("✅ fixNotificationIndexes: notification indexes are up to date");
  } catch (e) {
    // Non-fatal: don't block server startup if the migration can't run.
    console.error(
      "⚠️ fixNotificationIndexes failed (continuing startup):",
      e?.message || e
    );
  }
}

module.exports = fixNotificationIndexes;
