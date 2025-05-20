const Notification = require("../models/utils/Notification");
const Task = require("../models/Project/Task");
const Phase = require("../models/Project/Phase");
const Project = require("../models/Project/Project");

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

const checkPhaseStart = async () => {
  const now = new Date();

  const phases = await Phase.find({
    startDate: { $lte: now },
    notified: false,
  }).populate("projectId");

  for (const phase of phases) {
    const project = await Project.findById(phase.projectId).populate("members");

    if (!project || !project.members || project.members.length === 0) continue;

    const notifications = project.members.map((userId) => ({
      recipient: userId,
      message: `Phase "${phase.title}" has started in project "${project.title}".`,
      type: "phase-started",
      phase: phase._id,
      project: project._id,
    }));

    await Notification.insertMany(notifications);

    phase.notified = true;
    await phase.save();
  }
};

module.exports = { checkOverdueTasks, checkPhaseStart };
