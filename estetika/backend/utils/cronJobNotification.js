const Notification = require("../models/utils/Notification");
const Task = require("../models/Project/Task");

const checkOverdueTasks = async () => {
  const now = new Date();

  const overdueTasks = await Task.find({
    endDate: { $lt: now },
    status: { $ne: "completed" },
  });

  for (const task of overdueTasks) {
    for (const userId of task.assigned) {
      // Check if notification already exists
      const existing = await Notification.findOne({
        recipient: userId,
        task: task._id,
        type: "overdue",
      });

      if (!existing) {
        await Notification.create({
          recipient: userId,
          message: `Task "${task.title}" is overdue.`,
          type: "overdue",
          task: task._id,
        });
      }
    }
  }
};

module.exports = checkOverdueTasks;
