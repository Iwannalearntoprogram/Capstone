const DeletedProject = require("../models/Project/DeletedProject");

const mongoose = require("mongoose");

const cron = require("node-cron");

// Run daily at midnight
cron.schedule("0 0 * * *", async () => {
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  try {
    const expired = await DeletedProject.find({
      deletedAt: { $lte: new Date(now - THIRTY_DAYS) },
    });
    if (expired.length > 0) {
      await DeletedProject.deleteMany({
        deletedAt: { $lte: new Date(now - THIRTY_DAYS) },
      });
      console.log(
        `Deleted ${expired.length} expired projects from recycle bin.`
      );
    }
  } catch (err) {
    console.error("Error cleaning recycle bin:", err);
  }
});

module.exports = {};
