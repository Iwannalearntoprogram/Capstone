const User = require("../../models/User/User");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");

// Mute a user
const muteUser = catchAsync(async (req, res, next) => {
  const { userId, muteUserId } = req.body;
  if (!userId || !muteUserId) return next(new AppError("Missing userId or muteUserId", 400));
  await User.findByIdAndUpdate(userId, { $addToSet: { mutedUsers: muteUserId } });
  return res.status(200).json({ success: true });
});

// Unmute a user
const unmuteUser = catchAsync(async (req, res, next) => {
  const { userId, muteUserId } = req.body;
  if (!userId || !muteUserId) return next(new AppError("Missing userId or muteUserId", 400));
  await User.findByIdAndUpdate(userId, { $pull: { mutedUsers: muteUserId } });
  return res.status(200).json({ success: true });
});

module.exports = { muteUser, unmuteUser };
