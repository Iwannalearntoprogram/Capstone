const Task = require("../../models/Project/Task");
const Project = require("../../models/Project/Project");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const User = require("../../models/User/User");
const Phase = require("../../models/Project/Phase");
const Notification = require("../../models/utils/Notification");

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

  if (assigned && assigned.length > 0) {
    const assignedUsers = Array.isArray(assigned) ? assigned : [assigned];

    const notifications = assignedUsers.map((userId) => ({
      recipient: userId,
      message: `You have been assigned a new task: ${title}`,
      type: "assigned",
      task: newTask._id,
    }));

    try {
      const admins = await User.find({
        role: { $in: ["admin", "storage_admin"] },
      }).select("_id");
      const adminNotifs = admins.map((a) => ({
        recipient: a._id,
        message: `New task created: ${title}`,
        type: "update",
        task: newTask._id,
      }));
      await Notification.insertMany([...notifications, ...adminNotifs]);
    } catch (e) {
      await Notification.insertMany(notifications);
    }
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

  let updates = {};
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (status) updates.status = status;
  if (startDate) updates.startDate = startDate;
  if (endDate) updates.endDate = endDate;
  if (assigned) updates.assigned = assigned;

  const updatedTask = await Task.findByIdAndUpdate(id, updates, { new: true });

  if (!updatedTask) return next(new AppError("Task not found", 404));

  if (assigned) {
    const newAssigned = Array.isArray(assigned) ? assigned : [assigned];

    const notifications = newAssigned.map((userId) => ({
      recipient: userId,
      message: `You have been assigned to task: ${updatedTask.title}`,
      type: "assigned",
      task: updatedTask._id,
    }));

    await Notification.insertMany(notifications);
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
