const Notification = require("../models/utils/Notification");
const Task = require("../models/Project/Task");
const Phase = require("../models/Project/Phase");
const Project = require("../models/Project/Project");
const Event = require("../models/Project/Event");

const checkEventAlarms = async () => {
  const now = new Date();
  const events = await Event.find({
    alarm: { $type: "date", $lte: now, $ne: null },
    notified: false,
  });

  for (const event of events) {
    // Validate alarm date
    if (!event.alarm || isNaN(new Date(event.alarm).getTime())) {
      console.error("Invalid event alarm date:", event.alarm, event._id);
      continue;
    }
    // Notify the main user
    if (event.userId) {
      const existing = await Notification.findOne({
        recipient: event.userId,
        event: event._id,
        type: "alarm",
      });
      if (!existing) {
        await Notification.create({
          recipient: event.userId,
          message: `Event "${event.title}" alarm time reached.`,
          type: "alarm",
          event: event._id,
        });
      }
    }
    // Notify recipients
    if (event.recepient && event.recepient.length > 0) {
      for (const userId of event.recepient) {
        const existing = await Notification.findOne({
          recipient: userId,
          event: event._id,
          type: "alarm",
        });
        if (!existing) {
          await Notification.create({
            recipient: userId,
            message: `Reminder for Event "${event.title}".`,
            type: "alarm",
            event: event._id,
          });
        }
      }
    }
    event.notified = true;
    await event.save();
  }
};

const checkOverdueTasks = async () => {
  const now = new Date();

  const overdueTasks = await Task.find({
    endDate: { $type: "date", $lt: now, $ne: null },
    status: { $ne: "completed" },
  });

  for (const task of overdueTasks) {
    // Validate endDate
    if (!task.endDate || isNaN(new Date(task.endDate).getTime())) {
      console.error("Invalid task endDate:", task.endDate, task._id);
      continue;
    }
    for (const userId of task.assigned) {
      // Check if notification already exists for this user, task, and type
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
    startDate: { $type: "date", $lte: now, $ne: null },
    notified: false,
  }).populate("projectId");

  for (const phase of phases) {
    // Validate startDate
    if (!phase.startDate || isNaN(new Date(phase.startDate).getTime())) {
      console.error("Invalid phase startDate:", phase.startDate, phase._id);
      continue;
    }
    const project = await Project.findById(phase.projectId).populate("members");

    if (!project || !project.members || project.members.length === 0) continue;

    for (const userId of project.members) {
      // Check if notification already exists for this user, phase, and type
      const existing = await Notification.findOne({
        recipient: userId,
        phase: phase._id,
        type: "phase-started",
      });

      if (!existing) {
        await Notification.create({
          recipient: userId,
          message: `Phase "${phase.title}" has started in project "${project.title}".`,
          type: "phase-started",
          phase: phase._id,
          project: project._id,
        });
      }
    }

    phase.notified = true;
    await phase.save();
  }
};

module.exports = { checkEventAlarms, checkOverdueTasks, checkPhaseStart };
