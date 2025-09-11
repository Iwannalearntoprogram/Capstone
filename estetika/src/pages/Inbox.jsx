import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import socket from "../utils/socket";
import UserList from "../components/inbox/UserList";
import ChatWindow from "../components/inbox/ChatWindow";
import Cookies from "js-cookie";
import {
  FiSend,
  FiPaperclip,
  FiMic,
  FiSmile,
  FiBell,
  FiMenu,
} from "react-icons/fi";
import defaultProfile from "../assets/images/user.png";

function Inbox() {
  const storedUserId = localStorage.getItem("id");
  const token = Cookies.get("token");
  const [userId, setUserId] = useState(storedUserId);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  const selectedUserRef = useRef(selectedUser);
  const userIdRef = useRef(userId);

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    selectedUserRef.current = selectedUser;
    userIdRef.current = userId;
  }, [selectedUser, userId]);

  const fetchUsers = React.useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(
        `${serverUrl}/api/conversation/summary?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Fetch current user's mutedUsers from backend (assume returned in res.data or fetch separately if needed)
      // For now, assume res.data is array of users, and each user has isMuted property
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching conversation summary:", error);
    }
  }, [userId, token, serverUrl]);

  useEffect(() => {
    socket.on("connect", () => {
      if (userId) {
        socket.emit("online", userId);
      }
    });
    fetchUsers();

    socket.on("update_user_list", (updatedUsers) => {
      const filteredUsers = updatedUsers.filter((user) => user._id !== userId);
      setUsers(filteredUsers);
    });

    // Listen for real-time unread count updates
    socket.on("update_unread_counts", (data) => {
      if (data.userId === userId) {
        fetchUsers();
      }
    });

    return () => {
      socket.off("update_user_list");
      socket.off("update_unread_counts");
    };
  }, [userId, fetchUsers]);

  useEffect(() => {
    if (!search) {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter((user) => {
          const name = user.firstName || user.fullName || user.username || "";
          return name.toLowerCase().includes(search.toLowerCase());
        })
      );
    }
  }, [search, users]);

  const fetchMessages = async (user) => {
    try {
      const res = await axios.get(
        `${serverUrl}/api/message?user1=${userId}&user2=${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const processedMessages = res.data.map((msg) => {
        if (msg.file && msg.file.url) {
          return {
            ...msg,
            fileLink: msg.file.url,
            fileType: msg.file.type,
            fileName: msg.file.name,
          };
        }
        return msg;
      });

      setMessages(processedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    fetchMessages(user);
    // Mark all messages from this user as read
    if (user && user._id) {
      axios.post(
        `${serverUrl}/api/message/mark-read`,
        {
          userId,
          senderId: user._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
  };

  const sendMessage = () => {
    if (!content || !selectedUser) return;
    socket.emit("send_private_message", {
      sender: userId,
      recipientId: selectedUser._id,
      content,
    });
    setMessages((prev) => [
      ...prev,
      { sender: userId, content, timestamp: new Date() },
    ]);
    setContent("");
    // Mark all messages from this user as read (replying counts as read)
    axios.post(
      `${serverUrl}/api/message/mark-read`,
      {
        userId,
        senderId: selectedUser._id,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${serverUrl}/api/upload/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const fileLink = response.data.fileLink;
      const fileType = response.data.fileType;
      const fileName = file.name;

      const fileMessage = {
        sender: userId,
        recipientId: selectedUser._id,
        fileLink,
        fileType,
        fileName,
        timestamp: new Date(),
      };

      // Update sender's messages state
      setMessages((prev) => [...prev, fileMessage]);

      // Emit socket event
      socket.emit("send_private_file", fileMessage);
    } catch (error) {
      console.error("File upload failed:", error);
    }
  };

  useEffect(() => {
    const handleMessage = (msg) => {
      const selected = selectedUserRef.current;
      if (msg.sender === selected?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receive_private_message", handleMessage);

    return () => {
      socket.off("receive_private_message", handleMessage);
    };
  }, []);

  useEffect(() => {
    const handleFileMessage = (fileMessage) => {
      const selected = selectedUserRef.current;
      if (fileMessage.sender === selected?._id) {
        setMessages((prev) => [...prev, fileMessage]);
      }
    };

    socket.on("receive_private_file", handleFileMessage);

    return () => {
      socket.off("receive_private_file", handleFileMessage);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <div className="w-1/5 bg-white border-r border-gray-200 flex flex-col pt-12 max-h-full">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search"
            className="w-full px-3 py-2 border border-gray-300 rounded-full text-sm outline-none focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <UserList
            users={filteredUsers}
            selectedUser={selectedUser}
            onSelect={handleUserSelect}
            userId={userId}
            token={token}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50 mt-12">
        {selectedUser ? (
          <>
            <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              {selectedUser.profileImage ? (
                <img
                  src={selectedUser.profileImage}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <img
                  src={defaultProfile}
                  alt="Default Profile"
                  className="w-9 h-9 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold text-base text-gray-900">
                  {selectedUser.firstName ||
                    selectedUser.fullName ||
                    selectedUser.username}
                </h3>
                <span className="text-sm text-gray-500">
                  {selectedUser.socketId ? "Active now" : "Offline"}
                </span>
              </div>
            </div>

            <div className="flex-1 px-6 py-5">
              <ChatWindow messages={messages} userId={userId} />
            </div>

            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <input
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full text-sm outline-none focus:border-blue-500"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type message here..."
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <div className="flex items-center gap-2">
                  <label className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                    <FiPaperclip size={16} />
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <button
                    className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    onClick={sendMessage}
                    aria-label="Send"
                  >
                    <FiSend size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">
                Select a conversation
              </h3>
              <p>Choose a user from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inbox;
