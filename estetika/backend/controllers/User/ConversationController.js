const Message = require("../../models/User/Message");
const User = require("../../models/User/User");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");

// Get conversation summary for a user
const conversation_summary = catchAsync(async (req, res, next) => {
  const { userId } = req.query;
  if (!userId) return next(new AppError("Missing userId", 400));

  // Find all users except current
  const currentUser = await User.findById(userId);
  const users = await User.find({ _id: { $ne: userId } });

  // For each user, get unread count and last exchanged message timestamp
  const summaries = await Promise.all(
    users.map(async (otherUser) => {
      // If muted, unreadCount is always 0
      let unreadCount = 0;
      const isMuted =
        currentUser.mutedUsers &&
        currentUser.mutedUsers
          .map((id) => id.toString())
          .includes(otherUser._id.toString());
      if (!isMuted) {
        unreadCount = await Message.countDocuments({
          sender: otherUser._id,
          recipient: userId,
          status: { $in: ["sent", "delivered"] },
        });
      }
      // Last exchanged message (sent or received)
      const lastMsg = await Message.findOne({
        $or: [
          { sender: otherUser._id, recipient: userId },
          { sender: userId, recipient: otherUser._id },
        ],
      })
        .sort({ timestamp: -1 })
        .select("timestamp");
      return {
        _id: otherUser._id,
        username: otherUser.username,
        firstName: otherUser.firstName,
        fullName: otherUser.fullName,
        profileImage: otherUser.profileImage,
        socketId: otherUser.socketId,
        unreadCount,
        lastMessageTimestamp: lastMsg ? lastMsg.timestamp : null,
        isMuted,
      };
    })
  );

  // Sort by lastMessageTimestamp desc
  summaries.sort((a, b) => {
    if (!a.lastMessageTimestamp && !b.lastMessageTimestamp) return 0;
    if (!a.lastMessageTimestamp) return 1;
    if (!b.lastMessageTimestamp) return -1;
    return new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp);
  });

  return res.status(200).json(summaries);
});

module.exports = { conversation_summary };
