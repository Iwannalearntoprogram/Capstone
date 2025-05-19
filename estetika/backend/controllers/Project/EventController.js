const Event = require("../../models/Project/Event");
const User = require("../../models/User/User");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

// Get Event by Id or UserId
const event_get = catchAsync(async (req, res, next) => {
  const { id, userId } = req.query;

  let event;

  if (!id && !userId)
    return next(new AppError("Event identifier not found", 400));

  if (id) {
    event = await Event.findById(id).populate("userId", "-password");
  } else {
    event = await Event.find({ userId }).populate("userId", "-password");
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
    repeat,
    color,
    file,
    notes,
  } = req.body;

  const isUserValid = await User.findById(userId);

  if (!isUserValid)
    return next(new AppError("User not found. Invalid User ID.", 404));

  if (!title) {
    return next(new AppError("Cannot create event, missing title.", 400));
  }

  const newEvent = new Event({
    userId,
    title,
    alarm,
    startDate,
    endDate,
    location,
    repeat,
    color,
    file,
    notes,
  });

  await newEvent.save();

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
    repeat,
    color,
    file,
    notes,
  } = req.body;

  if (!id) return next(new AppError("Event identifier not found", 400));

  if (
    !title &&
    !alarm &&
    !startDate &&
    !endDate &&
    !location &&
    !repeat &&
    !color &&
    !file &&
    !notes
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
  if (repeat !== undefined) updates.repeat = repeat;
  if (color) updates.color = color;
  if (file) updates.file = file;
  if (notes) updates.notes = notes;

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
