import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import socket from "../utils/socket";
import UserList from "../components/inbox/UserList";
import ChatWindow from "../components/inbox/ChatWindow";

function Inbox() {
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");

  // Use refs to access latest values inside socket listeners
  const selectedUserRef = useRef(selectedUser);
  const usernameRef = useRef(username);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
    usernameRef.current = username;
  }, [selectedUser, username]);

  // Fetch users from backend
  const fetchUsers = async () => {
    if (!username) return;
    console.log("GET /users?exclude=", username);
    const res = await axios.get(
      `http://localhost:3000/users?exclude=${username}`
    );
    console.log("Response /users:", res.data);
    setUsers(res.data);
  };

  // Fetch messages from backend
  const fetchMessages = async (user) => {
    console.log("GET /messages?user1=", username, "&user2=", user.username);
    const res = await axios.get(
      `http://localhost:3000/messages?user1=${username}&user2=${user.username}`
    );
    console.log("Response /messages:", res.data);
    setMessages(res.data);
  };

  // Register user in backend and socket
  const register = async () => {
    if (!username) return;
    console.log("POST /users", { username });
    await axios
      .post("http://localhost:3000/users", { username })
      .then((res) => console.log("Response /users POST:", res.data))
      .catch((err) => console.log("Error /users POST:", err));
    socket.emit("register_user", username);
    fetchUsers();
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
      sender: username,
      recipientId: selectedUser.socketId,
      content,
    });
    setMessages((prev) => [
      ...prev,
      { sender: username, content, timestamp: new Date() },
    ]);
    setContent("");
  };

  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      if (
        msg.sender === selectedUserRef.current?.username ||
        msg.sender === usernameRef.current
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleUpdateUserList = fetchUsers;

    socket.on("receive_private_message", handleReceiveMessage);
    socket.on("update_user_list", handleUpdateUserList);

    if (!selectedUser) return;

    messages.forEach((msg) => {
      if (
        msg.status !== "read" &&
        msg.recipient === username &&
        msg.sender === selectedUser.username
      ) {
        socket.emit("mark_as_read", { messageId: msg._id });
      }
    });

    return () => {
      socket.off("receive_private_message", handleReceiveMessage);
      socket.off("update_user_list", handleUpdateUserList);
    };
  }, [messages, selectedUser, username]);

  return (
    <div className="flex h-screen font-sans">
      {/* Sidebar */}
      <div className="w-1/4 p-6 border-r border-gray-200">
        <h3 className="font-bold mb-2">Set Username</h3>
        <input
          className="border rounded p-2 w-full mb-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
          onClick={register}
        >
          Enter
        </button>
        <UserList
          users={users}
          currentUser={username}
          selectedUser={selectedUser}
          onSelect={handleUserSelect}
        />
      </div>

      {/* Main Chat */}
      <div className="flex-1 p-6 flex flex-col">
        <h3 className="font-bold mb-2">
          Chat with {selectedUser?.username || "..."}
        </h3>
        <div className="flex-1">
          <ChatWindow messages={messages} username={username} />
        </div>
        <div className="flex gap-2 mt-2 w-1/2 mx-auto">
          <input
            className="flex-1 border rounded-full p-2"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            className="bg-blue-500 text-white px-4 rounded-full"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Inbox;
