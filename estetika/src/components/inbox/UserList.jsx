import React from "react";
import sofaImg from "../../assets/images/sofa.jpg";

const UserList = ({ users, selectedUser, onSelect }) => {
  const sorted = [...users].sort((a, b) => {
    if (a.socketId && !b.socketId) return -1;
    if (!a.socketId && b.socketId) return 1;
    return a.username.localeCompare(b.username);
  });

  return (
    <div className="pt-8">
      {sorted.map((user) => (
        <div
          key={user._id}
          className={`p-2 px-4 cursor-pointer flex justify-between items-center mb-1 gap-4 ${
            selectedUser?.username === user.username ? "bg-gray-100" : ""
          }`}
          onClick={() => onSelect(user)}
        >
          <img
            src={sofaImg}
            alt="User"
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
          <div className="flex w-full justify-between items-center">
            <h2 className="font-semibold text-start">
              {user.firstName ? user.firstName : user.fullName}
            </h2>
            <span
              className="text-xs"
              style={{ color: user.socketId ? "green" : "gray" }}
            >
              {user.socketId ? (
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              ) : (
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserList;
