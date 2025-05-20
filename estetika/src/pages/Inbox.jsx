import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import socket from "../utils/socket";
import UserList from "../components/inbox/UserList";
import ChatWindow from "../components/inbox/ChatWindow";
import Cookies from "js-cookie";
import { FiSend } from "react-icons/fi";

function Inbox() {
  const storedUserId = localStorage.getItem("id");
  const token = Cookies.get("token");
  const [userId, setUserId] = useState(storedUserId);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");

  // Use refs to access latest values inside socket listeners
  const selectedUserRef = useRef(selectedUser);
  const userIdRef = useRef(userId);

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
  }, []);

  // Fetch users from backend
  const fetchUsers = async () => {
    if (!userId) return;
    const res = await axios.get(
      `http://localhost:3000/api/user?exclude=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setUsers(res.data);
  };

  // Fetch messages from backend
  const fetchMessages = async (user) => {
    const res = await axios.get(
      `http://localhost:3000/api/message?user1=${userId}&user2=${user._id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setMessages(res.data);
  };

  // When user is selected, fetch messages
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    fetchMessages(user);
  };

  // Send message via socket and update local state
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

      // Append message if it's from the currently selected user
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
    <div className="flex h-screen font-sans">
      {/* Sidebar */}
      <div className="w-1/4 pt-6 border-r border-gray-200">
        <UserList
          users={users}
          selectedUser={selectedUser}
          onSelect={handleUserSelect}
        />
      </div>

      {/* Main Chat */}
      <div className="flex-1 p-6 flex flex-col">
        <h3 className="font-bold mb-2">
          Chat with {selectedUser?.userId || "..."}
        </h3>
        <div className="flex-1 ">
          <ChatWindow messages={messages} userId={userId} />
        </div>
        <div className="flex gap-2 mt-2 w-1/2 mx-auto">
          <input
            className="flex-1 border-1 px-4 border-black/20 rounded-full p-2"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            className="bg-blue-500 p-2 w-10 h-10 text-white rounded-full pointer-cursor"
            onClick={sendMessage}
            aria-label="Send"
          >
            <FiSend size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Inbox;
