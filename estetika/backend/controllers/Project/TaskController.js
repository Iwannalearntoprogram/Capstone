const Task = require("../../models/Project/Task");
const Project = require("../../models/Project/Project");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const User = require("../../models/User/User");
const Phase = require("../../models/Project/Phase");
const Notification = require("../../models/utils/Notification");
const { notifyMany } = require("../../utils/notifyMany");

// Get Task by Id or ProjectId
const task_get = catchAsync(async (req, res, next) => {
  const { id, projectId } = req.query;

  let task;

  if (!id && !projectId)
    return next(new AppError("Task identifier not found", 400));

  if (id) {
    task = await Task.findById(id)
      .populate("assigned", "-password")
      .populate("projectId")
      .populate("phaseId")
      .populate("userId", "-password");
  } else {
    task = await Task.find({ projectId })
      .populate("assigned", "-password")
      .populate("projectId")
      .populate("phaseId")
      .populate("userId", "-password");
  }

  if (!task)
    return next(new AppError("Task not found. Invalid Task Identifier.", 404));

  return res.status(200).json({ message: "Task Successfully Fetched", task });
});

// Create Task
const task_post = catchAsync(async (req, res, next) => {
  const userId = req.id;
  const {
    title,
    description,
    status,
    startDate,
    endDate,
    assigned,
    projectId,
    phaseId,
  } = req.body;

  if (!title || !projectId)
    return next(new AppError("Cannot create task, missing fields.", 400));

  const isUserValid = await User.findById(userId);

  if (!isUserValid)
    return next(new AppError("User not found. Invalid User ID.", 404));

  const isProjectValid = await Project.findById(projectId);
  if (!isProjectValid)
    return next(new AppError("Project not found. Invalid Project ID.", 404));

  const newTask = new Task({
    title,
    description,
    status,
    startDate,
    endDate,
    assigned,
    projectId,
    phaseId,
    userId,
  });

  await newTask.save();

  await Project.findByIdAndUpdate(
    projectId,
    { $push: { tasks: newTask._id } },
    { new: true }
  );

  await Phase.findByIdAndUpdate(
    phaseId,
    { $push: { tasks: newTask._id } },
    { new: true }
  );

  // Notification logic via helper: assigned users, creator (if designer/admin), designers, admins
  // Exclude client (projectCreator) from task/phase notifications
  try {
    const notifications = [];

    // Assigned users (explicit assignment)
    if (assigned && assigned.length) {
      (Array.isArray(assigned) ? assigned : [assigned]).forEach((uid) => {
        notifications.push({
          recipient: uid,
          type: "assigned",
          message: `You have been assigned a new task: ${title}`,
          project: projectId,
          task: newTask._id,
          phase: phaseId,
        });
      });
    }

    // Fetch project to get client ID
    const projectWithMembers = await Project.findById(projectId).select(
      "members title projectCreator"
    );
    const clientId = projectWithMembers?.projectCreator?.toString();

    // Designers on project (excluding client)
    let designerIds = [];
    if (projectWithMembers?.members?.length) {
      designerIds = await User.find({
        _id: { $in: projectWithMembers.members },
        role: { $in: ["designer"] },
      }).select("_id");
    }

    const creatorId = userId?.toString();
    const seen = new Set();

    // Only notify creator if they are NOT the client
    if (creatorId && creatorId !== clientId) {
      notifications.push({
        recipient: creatorId,
        type: "update",
        project: projectId,
        task: newTask._id,
        phase: phaseId,
        message: `You created a new task: ${title}`,
      });
      seen.add(creatorId);
    }

    // Designers (skip if already seen or is client)
    designerIds.forEach((d) => {
      const id = d._id.toString();
      if (seen.has(id) || id === clientId) return;
      seen.add(id);
      notifications.push({
        recipient: id,
        type: "update",
        project: projectId,
        task: newTask._id,
        phase: phaseId,
        message: `New task created: ${title}`,
      });
    });

    await notifyMany(notifications);
  } catch (e) {
    console.warn("Notification creation issue:", e?.code || e?.message || e);
  }

  return res
    .status(200)
    .json({ message: "Task Successfully Created", newTask });
});

// Update Task
const task_put = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  const { title, description, status, startDate, endDate, assigned } = req.body;

  if (!id) return next(new AppError("Task identifier not found", 400));

  const task = await Task.findById(id);
  if (!task) return next(new AppError("Task not found. Invalid Task ID.", 404));

  // Track status change for notification
  const oldStatus = task.status;
  const statusChanged = status && status !== oldStatus;

  let updates = {};
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (status) updates.status = status;
  if (startDate) updates.startDate = startDate;
  if (endDate) updates.endDate = endDate;
  if (assigned) updates.assigned = assigned;

  const updatedTask = await Task.findByIdAndUpdate(id, updates, { new: true });

  if (!updatedTask) return next(new AppError("Task not found", 404));

  // Notify project team about task update (excluding client)
  try {
    const notifications = [];

    // Get project to identify client and team
    const project = await Project.findById(updatedTask.projectId).select(
      "members title projectCreator"
    );
    const clientId = project?.projectCreator?.toString();

    // If assigned users changed, notify them specifically
    if (assigned) {
      const newAssigned = Array.isArray(assigned) ? assigned : [assigned];
      newAssigned.forEach((uid) => {
        notifications.push({
          recipient: uid,
          type: "assigned",
          message: `You have been assigned to task: ${updatedTask.title}`,
          project: updatedTask.projectId,
          task: updatedTask._id,
          phase: updatedTask.phaseId,
        });
      });
    }

    // Notify all designers on project
    let designerIds = [];
    if (project?.members?.length) {
      designerIds = await User.find({
        _id: { $in: project.members },
        role: { $in: ["designer"] },
      }).select("_id");
    }

    const seen = new Set();
    if (assigned) {
      (Array.isArray(assigned) ? assigned : [assigned]).forEach((uid) =>
        seen.add(uid.toString())
      );
    }

    // Determine message based on whether status changed
    const baseMessage = statusChanged
      ? `Task "${updatedTask.title}" status changed to ${updatedTask.status}`
      : `Task updated: ${updatedTask.title}`;

    // Add designers (skip if client or already assigned)
    designerIds.forEach((d) => {
      const id = d._id.toString();
      if (seen.has(id) || id === clientId) return;
      seen.add(id);
      notifications.push({
        recipient: id,
        type: "update",
        project: updatedTask.projectId,
        task: updatedTask._id,
        phase: updatedTask.phaseId,
        message: baseMessage,
      });
    });

    await notifyMany(notifications);
  } catch (e) {
    console.warn("Notification update issue:", e?.code || e?.message || e);
  }

  return res
    .status(200)
    .json({ message: "Task Updated Successfully", updatedTask });
});

// Delete Task
const task_delete = catchAsync(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new AppError("Task identifier not found", 400));

  const task = await Task.findById(id);
  if (!task) return next(new AppError("Task not found", 404));

  if (
    task.userId.toString() !== req.id &&
    !["admin", "storage_admin"].includes(req.role)
  ) {
    return next(
      new AppError("You are not authorized to delete this task", 403)
    );
  }

  const deletedTask = await Task.findByIdAndDelete(id);

  if (!deletedTask) return next(new AppError("Task not found", 404));

  await Project.findByIdAndUpdate(
    deletedTask.projectId,
    { $pull: { tasks: deletedTask._id } },
    { new: true }
  );

  await Phase.findByIdAndUpdate(
    deletedTask.phaseId,
    { $pull: { tasks: deletedTask._id } },
    { new: true }
  );

  return res
    .status(200)
    .json({ message: "Task Successfully Deleted", deletedTask });
});

module.exports = {
  task_get,
  task_post,
  task_put,
  task_delete,
};
