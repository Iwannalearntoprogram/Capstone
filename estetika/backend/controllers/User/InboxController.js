const Message = require("../../models/User/Message");
const User = require("../../models/User/User");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");

// Get conversation summary for inbox
const inbox_summary = catchAsync(async (req, res, next) => {
  const userId = req.query.userId;
  if (!userId) return next(new AppError("Missing userId", 400));

  // Get all users except self
  const users = await User.find({ _id: { $ne: userId } });

  // For each user, get unread count and latest message timestamp
  const summaries = await Promise.all(
    users.map(async (user) => {
      // Get unread messages sent to userId by this user
      const unreadCount = await Message.countDocuments({
        sender: user._id,
        recipient: userId,
        status: { $ne: "read" },
      });
      // Get latest message between userId and this user
      const latestMsg = await Message.findOne({
        $or: [
          { sender: userId, recipient: user._id },
          { sender: user._id, recipient: userId },
        ],
      })
        .sort({ timestamp: -1 })
        .lean();
      return {
        ...user.toObject(),
        unreadCount,
        latestTimestamp: latestMsg ? latestMsg.timestamp : null,
        latestMsgContent: latestMsg ? latestMsg.content : null,
      };
    })
  );

  // Sort by latestTimestamp desc
  summaries.sort((a, b) => {
    if (!a.latestTimestamp && !b.latestTimestamp) return 0;
    if (!a.latestTimestamp) return 1;
    if (!b.latestTimestamp) return -1;
    return new Date(b.latestTimestamp) - new Date(a.latestTimestamp);
  });

  return res.status(200).json(summaries);
});

module.exports = { inbox_summary };
