const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User/User");
const Message = require("../models/User/Message");
const Notification = require("../models/utils/Notification");
const { socketCorsOptions } = require("./cors");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: socketCorsOptions,
  });
  const activeCallsByUser = new Map();
  const callMembers = new Map();

  const userIdOf = (user) => user?._id?.toString();

  const getDisplayName = (user) =>
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "Unknown";

  const setCallMembers = (callId, members) => {
    const ids = members.filter(Boolean).map((id) => id.toString());
    callMembers.set(callId, new Set(ids));
    ids.forEach((id) => activeCallsByUser.set(id, callId));
  };

  const clearCall = (callId) => {
    const members = callMembers.get(callId);
    if (members) {
      members.forEach((memberId) => {
        if (activeCallsByUser.get(memberId) === callId) {
          activeCallsByUser.delete(memberId);
        }
      });
    }
    callMembers.delete(callId);
  };

  const emitToUser = async (recipientId, event, payload) => {
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.socketId) return false;
    io.to(recipient.socketId).emit(event, payload);
    return true;
  };

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

    socket.on("online", async (userId) => {
      try {
        await User.findByIdAndUpdate(userId, { socketId: socket.id }); // Always update
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
            sender: sender._id,
            content,
            timestamp: message.timestamp,
          });
          // Notify recipient to update unread counts
          io.to(recipientUser.socketId).emit("update_unread_counts", {
            userId: recipientUser._id,
          });
        }
        if (sender.socketId) {
          io.to(sender.socketId).emit("update_unread_counts", {
            userId: sender._id,
          });
        }

        if (sender.role === "designer" && recipientUser.role === "client") {
          // Check if a similar notification was created in the last 10 minutes
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
          const existingNotification = await Notification.findOne({
            recipient: recipientUser._id,
            type: "update",
            message: `Designer: ${sender.fullName} has messaged you.`,
            createdAt: { $gte: tenMinutesAgo },
          });

          if (!existingNotification) {
            await Notification.create({
              recipient: recipientUser._id,
              message: `Designer: ${sender.fullName} has messaged you.`,
              type: "update",
            });
          }
        }
      } catch (err) {
        console.error("Error in send_private_message:", err.message);
      }
    });

    socket.on(
      "send_private_file",
      async ({ recipientId, fileLink, fileType, fileName }) => {
        try {
          const sender = socket.user;
          const recipientUser = await User.findById(recipientId);
          if (!recipientUser) return;

          const message = await Message.create({
            sender: sender._id,
            recipient: recipientUser._id,
            file: {
              url: fileLink,
              type: fileType,
              name: fileName,
            },
          });

          if (recipientUser.socketId) {
            io.to(recipientUser.socketId).emit("receive_private_file", {
              sender: sender._id,
              fileLink,
              fileType,
              fileName,
              timestamp: message.timestamp,
            });
          }
        } catch (err) {
          console.error("Error in send_private_file:", err.message);
          socket.emit("file_error", "Failed to send file");
        }
      }
    );

    socket.on("mark_as_read", async ({ messageId }) => {
      try {
        const message = await Message.findByIdAndUpdate(
          messageId,
          { status: "read" },
          { new: true }
        );
        if (message) {
          // Notify both sender and recipient to update unread counts
          const senderUser = await User.findById(message.sender);
          const recipientUser = await User.findById(message.recipient);
          if (senderUser && senderUser.socketId) {
            io.to(senderUser.socketId).emit("update_unread_counts", {
              userId: senderUser._id,
            });
          }
          if (recipientUser && recipientUser.socketId) {
            io.to(recipientUser.socketId).emit("update_unread_counts", {
              userId: recipientUser._id,
            });
          }
        }
      } catch (err) {
        console.error("Error marking message as read:", err.message);
      }
    });

    socket.on("call_invite", async ({ recipientId, callId, type }) => {
      try {
        const caller = socket.user;
        const callerId = userIdOf(caller);
        const recipientUser = await User.findById(recipientId);
        const currentCallId = callId || `${socket.id}-${Date.now()}`;

        if (!recipientUser || !recipientUser.socketId) {
          socket.emit("call_unavailable", { callId: currentCallId });
          return;
        }

        const recipientUserId = recipientUser._id.toString();
        if (
          activeCallsByUser.has(callerId) ||
          activeCallsByUser.has(recipientUserId)
        ) {
          socket.emit("call_busy", { callId: currentCallId });
          return;
        }

        setCallMembers(currentCallId, [callerId, recipientUserId]);
        io.to(recipientUser.socketId).emit("call_incoming", {
          callId: currentCallId,
          type: type === "video" ? "video" : "voice",
          callerId,
          callerName: getDisplayName(caller),
          callerProfileImage: caller.profileImage,
        });
      } catch (err) {
        console.error("Error in call_invite:", err.message);
      }
    });

    socket.on("call_accept", async ({ recipientId, callId, type }) => {
      try {
        const accepter = socket.user;
        const accepterId = userIdOf(accepter);
        setCallMembers(callId, [accepterId, recipientId]);
        await emitToUser(recipientId, "call_accepted", {
          callId,
          type: type === "video" ? "video" : "voice",
          accepterId,
          accepterName: getDisplayName(accepter),
        });
      } catch (err) {
        console.error("Error in call_accept:", err.message);
      }
    });

    socket.on("call_reject", async ({ recipientId, callId }) => {
      try {
        clearCall(callId);
        await emitToUser(recipientId, "call_rejected", {
          callId,
          rejectedBy: userIdOf(socket.user),
        });
      } catch (err) {
        console.error("Error in call_reject:", err.message);
      }
    });

    socket.on("call_signal", async ({ recipientId, callId, signal }) => {
      try {
        await emitToUser(recipientId, "call_signal", {
          callId,
          senderId: userIdOf(socket.user),
          signal,
        });
      } catch (err) {
        console.error("Error in call_signal:", err.message);
      }
    });

    socket.on("call_end", async ({ recipientId, callId }) => {
      try {
        clearCall(callId);
        await emitToUser(recipientId, "call_ended", {
          callId,
          endedBy: userIdOf(socket.user),
        });
      } catch (err) {
        console.error("Error in call_end:", err.message);
      }
    });

    socket.on("disconnect", async () => {
      try {
        const disconnectedUserId = userIdOf(socket.user);
        const callId = activeCallsByUser.get(disconnectedUserId);
        const members = callMembers.get(callId);

        if (callId && members) {
          clearCall(callId);
          await Promise.all(
            Array.from(members)
              .filter((memberId) => memberId !== disconnectedUserId)
              .map((memberId) =>
                emitToUser(memberId, "call_ended", {
                  callId,
                  endedBy: disconnectedUserId,
                })
              )
          );
        }

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
