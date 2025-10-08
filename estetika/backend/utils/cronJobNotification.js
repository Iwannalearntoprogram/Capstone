const Notification = require("../models/utils/Notification");
const Task = require("../models/Project/Task");
const Phase = require("../models/Project/Phase");
const Project = require("../models/Project/Project");
const Event = require("../models/Project/Event");
const notifyMany = require("./notifyMany");

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

    // Batch all notifications for this event
    const notificationList = [];

    // Notify the main user
    if (event.userId) {
      notificationList.push({
        recipient: event.userId,
        message: `Event "${event.title}" alarm time reached.`,
        type: "alarm",
        event: event._id,
      });
    }

    // Notify recipients
    if (event.recipient && event.recipient.length > 0) {
      for (const userId of event.recipient) {
        notificationList.push({
          recipient: userId,
          message: `Reminder for Event "${event.title}".`,
          type: "alarm",
          event: event._id,
        });
      }
    }

    if (notificationList.length > 0) {
      await notifyMany(notificationList);
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
  }).populate("projectId");

  for (const task of overdueTasks) {
    // Validate endDate
    if (!task.endDate || isNaN(new Date(task.endDate).getTime())) {
      console.error("Invalid task endDate:", task.endDate, task._id);
      continue;
    }

    const clientId = task.projectId?.projectCreator?.toString();
    const notificationList = [];

    for (const userId of task.assigned) {
      const uid = userId.toString ? userId.toString() : userId;
      // Skip client from overdue task notifications
      if (uid === clientId) continue;

      notificationList.push({
        recipient: uid,
        message: `Task "${task.title}" is overdue.`,
        type: "overdue",
        task: task._id,
      });
    }

    if (notificationList.length > 0) {
      await notifyMany(notificationList);
    }
  }
};

const checkPhaseStart = async () => {
  const now = new Date();
  const User = require("../models/User/User");

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

    const clientId = project.projectCreator?.toString();
    const notificationList = [];

    for (const userId of project.members) {
      const uid = userId.toString ? userId.toString() : userId;
      // Skip client from phase notifications
      if (uid === clientId) continue;

      notificationList.push({
        recipient: uid,
        message: `Phase "${phase.title}" has started in project "${project.title}".`,
        type: "phase-started",
        phase: phase._id,
        project: project._id,
      });
    }

    if (notificationList.length > 0) {
      await notifyMany(notificationList);
    }

    phase.notified = true;
    await phase.save();
  }
};

const checkPhaseCompletion = async () => {
  const now = new Date();
  const User = require("../models/User/User");

  const phases = await Phase.find({
    endDate: { $type: "date", $lte: now, $ne: null },
    completionNotified: false,
  }).populate("projectId");

  for (const phase of phases) {
    // Validate endDate
    if (!phase.endDate || isNaN(new Date(phase.endDate).getTime())) {
      console.error("Invalid phase endDate:", phase.endDate, phase._id);
      continue;
    }

    const project = await Project.findById(phase.projectId).populate("members");

    if (!project || !project.members || project.members.length === 0) continue;

    const clientId = project.projectCreator?.toString();
    const notificationList = [];

    for (const userId of project.members) {
      const uid = userId.toString ? userId.toString() : userId;
      // Skip client from phase completion notifications
      if (uid === clientId) continue;

      notificationList.push({
        recipient: uid,
        message: `Phase "${phase.title}" has been completed in project "${project.title}".`,
        type: "phase-completed",
        phase: phase._id,
        project: project._id,
      });
    }

    if (notificationList.length > 0) {
      await notifyMany(notificationList);
    }

    phase.completionNotified = true;
    await phase.save();
  }
};

module.exports = {
  checkEventAlarms,
  checkOverdueTasks,
  checkPhaseStart,
  checkPhaseCompletion,
};
