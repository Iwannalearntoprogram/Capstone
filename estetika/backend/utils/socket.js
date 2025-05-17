const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User/User");
const Message = require("../models/User/Message");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3001",
      methods: ["GET", "POST"],
    },
  });

  // Socket.IO auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication token missing"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (err) {
      console.error("Socket auth error:", err.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    socket.user.socketId = socket.id;

    socket.on("register_user", async (userId) => {
      try {
        let user = await User.findById(userId);
        if (!user) {
          throw new Error("User not found");
        }
        user.socketId = socket.id;
        await User.findByIdAndUpdate(userId, { socketId: socket.id });

        const users = await User.find({});
        io.emit("update_user_list", users);
      } catch (err) {
        console.error("register_user error:", err.message);
      }
    });

    socket.on("send_private_message", async ({ recipientId, content }) => {
      try {
        const sender = socket.user;
        const recipientUser = await User.findById(recipientId);
        if (!recipientUser) return;

        const message = await Message.create({
          sender: sender._id,
          recipient: recipientUser._id,
          content,
        });

        if (recipientUser.socketId) {
          io.to(recipientUser.socketId).emit("receive_private_message", {
            sender: sender.username,
            content,
            timestamp: message.timestamp,
          });
        }
      } catch (err) {
        console.error("Error in send_private_message:", err.message);
      }
    });

    socket.on("mark_as_read", async ({ messageId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { status: "read" });
      } catch (err) {
        console.error("Error marking message as read:", err.message);
      }
    });

    socket.on("disconnect", async () => {
      try {
        await User.findByIdAndUpdate(socket.user._id, { socketId: null });
        const users = await User.find({});
        io.emit("update_user_list", users);
      } catch (err) {
        console.error("Error on disconnect:", err.message);
      }
    });
  });
};

module.exports = initSocket;
