const Message = require("../../models/User/Message");
const User = require("../../models/User/User");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");

// Get messages between two users
const message_get = catchAsync(async (req, res, next) => {
  const { user1, user2 } = req.query;

  const messages = await Message.find({
    $or: [
      { sender: user1, recipient: user2 },
      { sender: user2, recipient: user1 },
    ],
  }).sort("timestamp");

  return res.status(200).json(messages);
});

const message_post = catchAsync(async (req, res, next) => {
  const { senderId, recipientId, content } = req.body;

  const isSenderValid = await User.findById(senderId);

  const isRecipientValid = await User.findById(recipientId);

  if (!isSenderValid || !isRecipientValid)
    return next(new AppError("Sender not found. Invalid Sender ID.", 404));

  const newMessage = await Message.create({
    sender: senderId,
    recipient: recipientId,
    content,
  });

  return res.status(201).json(newMessage);
});

module.exports = {
  message_get,
  message_post,
};
