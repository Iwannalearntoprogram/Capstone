const Notification = require("../../models/utils/Notification");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const User = require("../../models/User/User");
const Task = require("../../models/Project/Task");
const Project = require("../../models/Project/Project");
const Phase = require("../../models/Project/Phase");

// Get Notifications (by recipient or id)
const notification_get = catchAsync(async (req, res, next) => {
  const { id, recipient } = req.query;

  let notifications;
  if (!id && !recipient)
    return next(new AppError("Notification identifier not found", 400));

  if (id) {
    notifications = await Notification.findById(id)
      .populate("recipient", "-password")
      .populate("task")
      .populate("project")
      .populate("phase");
  } else {
    // recipient is now a single ObjectId, not an array
    notifications = await Notification.find({
      recipient: recipient,
    })
      .populate("recipient", "-password")
      .populate("task")
      .populate("project")
      .populate("phase")
      .sort({ createdAt: -1 });
  }

  if (!notifications) return next(new AppError("Notification not found.", 404));

  return res
    .status(200)
    .json({ message: `Notification${id ? "" : "s"} fetched`, notifications });
});

// Create Notification
const notification_post = catchAsync(async (req, res, next) => {
  const { recipient, message, type, task, project, phase } = req.body;

  if (!recipient || !type)
    return next(new AppError("Missing required fields.", 400));

  const isUserValid = await User.findById(recipient);
  if (!isUserValid) return next(new AppError("Recipient not found.", 404));

  const notification = new Notification({
    recipient,
    message,
    type,
    task,
    project,
    phase,
  });

  await notification.save();

  return res
    .status(200)
    .json({ message: "Notification created", notification });
});

// Update Notification (e.g., mark as read)
const notification_put = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  const { read } = req.body;

  if (!id) return next(new AppError("Notification identifier not found", 400));

  const notification = await Notification.findByIdAndUpdate(
    id,
    { read },
    { new: true }
  );

  if (!notification) return next(new AppError("Notification not found", 404));

  return res
    .status(200)
    .json({ message: "Notification updated", notification });
});

// Delete Notification
const notification_delete = catchAsync(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new AppError("Notification identifier not found", 400));

  const notification = await Notification.findByIdAndDelete(id);

  if (!notification) return next(new AppError("Notification not found", 404));

  return res
    .status(200)
    .json({ message: "Notification deleted", notification });
});

module.exports = {
  notification_get,
  notification_post,
  notification_put,
  notification_delete,
};

// --- Sample Request Bodies ---

// GET (by recipient or id) - query params, not body
// Example: /api/notifications?id=NOTIFICATION_ID
// Example: /api/notifications?recipient=USER_ID

// POST /api/notifications
// Content-Type: application/json
/*
{
    "recipient": "USER_ID",
    "message": "You have a new task assigned.",
    "type": "task_assigned",
    "task": "TASK_ID",         // optional
    "project": "PROJECT_ID",   // optional
    "phase": "PHASE_ID"        // optional
}
*/

// PUT /api/notifications?id=NOTIFICATION_ID
// Content-Type: application/json
/*
{
    "read": true
}
*/

// DELETE (by id) - query param, not body
// Example: /api/notifications?id=NOTIFICATION_ID
