import React from "react";
import defaultProfile from "../../assets/images/user.png";

const UserList = ({ users, selectedUser, onSelect }) => {
  const sorted = [...users].sort((a, b) => {
    if (a.socketId && !b.socketId) return -1;
    if (!a.socketId && b.socketId) return 1;
    const aName = a.firstName || a.fullName || a.username || "";
    const bName = b.firstName || b.fullName || b.username || "";
    return aName.localeCompare(bName);
  });

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-full overflow-y-auto ">
      {sorted.map((user) => {
        const userName = user.firstName || user.fullName || user.username;
        const isSelected = selectedUser?._id === user._id;

        return (
          <div
            key={user._id}
            className={`flex items-center p-3 mx-4 my-1 cursor-pointer rounded-lg transition-colors hover:bg-gray-50 ${
              isSelected ? "bg-blue-50" : ""
            }`}
            onClick={() => onSelect(user)}
          >
            <img
              src={user.profileImage || defaultProfile}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover mr-3"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm mb-0.5">
                {userName}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 ml-2">
              <div className="text-xs text-gray-400">{formatTime()}</div>
              <div
                className={`w-2 h-2 rounded-full ${
                  user.socketId ? "bg-green-400" : "bg-gray-300"
                }`}
              ></div>
            </div>
          </div>
        );
      })}

      {sorted.length === 0 && (
        <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
          No users available
        </div>
      )}
    </div>
  );
};

export default UserList;
