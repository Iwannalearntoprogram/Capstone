import React from "react";

const UserList = ({ users, currentUser, selectedUser, onSelect }) => {
  const sorted = [...users].sort((a, b) => {
    if (a.socketId && !b.socketId) return -1;
    if (!a.socketId && b.socketId) return 1;
    return a.username.localeCompare(b.username);
  });

  return (
    <div>
      <h4 className="font-bold mb-2">Users</h4>
      {sorted.map((user) => (
        <div
          key={user._id}
          className={`p-2 rounded cursor-pointer flex justify-between items-center mb-1 ${
            selectedUser?.username === user.username ? "bg-blue-100" : ""
          }`}
          onClick={() => onSelect(user)}
        >
          <span>{user.username}</span>
          <span
            className="text-xs"
            style={{ color: user.socketId ? "green" : "gray" }}
          >
            {user.socketId ? "🟢" : "⚪"}
          </span>
        </div>
      ))}
    </div>
  );
};

export default UserList;
