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

    return () => {
      socket.off("update_user_list");
    };
  }, [userId]);

  const fetchUsers = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${serverUrl}/api/user?exclude=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

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
      setMessages(res.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    fetchMessages(user);
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
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50 mt-12">
        {selectedUser ? (
          <>
            <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                {(selectedUser.firstName ||
                  selectedUser.fullName ||
                  selectedUser.username ||
                  "U")[0].toUpperCase()}
              </div>
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
                  <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <FiPaperclip size={16} />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <FiSmile size={16} />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <FiMic size={16} />
                  </button>
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
