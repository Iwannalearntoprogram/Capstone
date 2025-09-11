const Message = require("../../models/User/Message");
const catchAsync = require("../../utils/catchAsync");

// Mark all messages from sender to user as read
const markMessagesRead = catchAsync(async (req, res, next) => {
  const { userId, senderId } = req.body;
  if (!userId || !senderId)
    return res.status(400).json({ error: "Missing userId or senderId" });
  await Message.updateMany(
    { recipient: userId, sender: senderId, status: { $ne: "read" } },
    { status: "read" }
  );
  return res.status(200).json({ success: true });
});

module.exports = { markMessagesRead };
