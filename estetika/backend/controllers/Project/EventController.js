const Event = require("../../models/Project/Event");
const User = require("../../models/User/User");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const Notification = require("../../models/utils/Notification");

// Get Event by Id or UserId
const event_get = catchAsync(async (req, res, next) => {
  const { id, userId } = req.query;

  let event;

  if (!id && !userId)
    return next(new AppError("Event identifier not found", 400));

  if (id) {
    event = await Event.findById(id)
      .populate("userId", "-password")
      .populate("recipient", "-password");
  } else {
    event = await Event.find({
      $or: [{ userId }, { recipient: userId }],
    })
      .populate("userId", "-password")
      .populate("recipient", "-password");
  }

  if (!event)
    return next(
      new AppError("Event not found. Invalid Event Identifier.", 404)
    );

  return res.status(200).json({ message: "Event Successfully Fetched", event });
});

// Create Event
const event_post = catchAsync(async (req, res, next) => {
  const userId = req.id;
  const {
    title,
    alarm,
    startDate,
    endDate,
    location,
    color,
    file,
    notes,
    recipient,
  } = req.body;

  const isUserValid = await User.findById(userId);

  if (!isUserValid)
    return next(new AppError("User not found. Invalid User ID.", 404));

  if (!title) {
    return next(new AppError("Cannot create event, missing title.", 400));
  }

  let recipients = [];

  if (recipient) {
    if (Array.isArray(recipient)) {
      const resolvedRecipients = await Promise.all(
        recipient.map(async (receiver) => {
          const user = await User.findOne({
            $or: [{ email: receiver }, { username: receiver }],
          });
          return user ? user._id : null;
        })
      );
      recipients = resolvedRecipients.filter(Boolean);
    }
  }

  const newEvent = new Event({
    userId,
    title,
    alarm,
    startDate,
    endDate,
    location,
    color,
    file,
    notes,
    recipient: recipients,
  });

  await newEvent.save();

  if (recipients.length > 0) {
    const notifications = recipients.map((recipientId) => ({
      recipient: recipientId,
      message: `You have been assigned a new event: ${title}`,
      type: "assigned",
      event: newEvent._id,
    }));
    await Notification.insertMany(notifications);
  }

  return res
    .status(200)
    .json({ message: "Event Successfully Created", newEvent });
});

// Update Event
const event_put = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  const {
    title,
    alarm,
    startDate,
    endDate,
    location,
    color,
    file,
    notes,
    recipient,
  } = req.body;

  if (!id) return next(new AppError("Event identifier not found", 400));

  if (
    !title &&
    !alarm &&
    !startDate &&
    !endDate &&
    !location &&
    !color &&
    !file &&
    !notes &&
    !recipient
  ) {
    return next(new AppError("No data to update", 400));
  }

  const event = await Event.findById(id);

  if (!event) {
    return next(new AppError("Event not found. Invalid Event ID.", 404));
  }

  let updates = {};

  if (title) updates.title = title;
  if (alarm) updates.alarm = alarm;
  if (startDate) updates.startDate = startDate;
  if (endDate) updates.endDate = endDate;
  if (location) updates.location = location;
  if (color) updates.color = color;
  if (file) updates.file = file;
  if (notes) updates.notes = notes;

  if (recipient) {
    if (Array.isArray(recipient)) {
      const resolvedRecipients = await Promise.all(
        recipient.map(async (receiver) => {
          const user = await User.findOne({
            $or: [{ email: receiver }, { username: receiver }],
          });
          return user ? user._id : null;
        })
      );
      updates.recipient = resolvedRecipients.filter(Boolean);
    }
  }

  const updatedEvent = await Event.findByIdAndUpdate(id, updates, {
    new: true,
  });

  if (!updatedEvent) {
    return next(new AppError("Event not found", 404));
  }

  return res
    .status(200)
    .json({ message: "Event Updated Successfully", updatedEvent });
});

// Delete Event
const event_delete = catchAsync(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new AppError("Event identifier not found", 400));

  const event = await Event.findById(id);
  if (!event) return next(new AppError("Event not found", 404));

  if (
    event.userId &&
    event.userId.toString() !== req.id &&
    req.role !== "admin"
  ) {
    return next(
      new AppError("You are not authorized to delete this event", 403)
    );
  }

  const deletedEvent = await Event.findByIdAndDelete(id);

  if (!deletedEvent) return next(new AppError("Event not found", 404));

  return res
    .status(200)
    .json({ message: "Event Successfully Deleted", deletedEvent });
});

module.exports = {
  event_get,
  event_post,
  event_put,
  event_delete,
};
