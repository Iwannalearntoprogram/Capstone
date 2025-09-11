import React from "react";
import defaultProfile from "../../assets/images/user.png";
import axios from "axios";

const Toast = ({ message, type, onClose }) => (
  <div
    className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    }`}
  >
    {message}
    <button className="ml-2 text-xs" onClick={onClose}>
      ✕
    </button>
  </div>
);

const UserList = ({ users, selectedUser, onSelect, userId, token }) => {
  const [loadingId, setLoadingId] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [userStates, setUserStates] = React.useState(
    users.map((u) => ({ ...u }))
  );

  React.useEffect(() => {
    setUserStates(users.map((u) => ({ ...u })));
  }, [users]);

  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const handleMuteToggle = async (user, isMuted) => {
    setLoadingId(user._id);
    try {
      const endpoint = isMuted
        ? `${serverUrl}/api/user/unmute`
        : `${serverUrl}/api/user/mute`;
      await axios.post(
        endpoint,
        {
          userId,
          muteUserId: user._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUserStates((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isMuted: !isMuted } : u))
      );
      setToast({
        message: isMuted
          ? `Unmuted ${user.firstName || user.username}`
          : `Muted ${user.firstName || user.username}`,
        type: "success",
      });
    } catch (err) {
      setToast({ message: "Mute/unmute failed", type: "error" });
      console.error("Mute/unmute failed", err);
    } finally {
      setLoadingId(null);
    }
  };
  // Sort by lastMessageTimestamp desc, fallback to name
  const sorted = [...userStates].sort((a, b) => {
    if (a.lastMessageTimestamp && b.lastMessageTimestamp) {
      return (
        new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp)
      );
    }
    if (a.lastMessageTimestamp) return -1;
    if (b.lastMessageTimestamp) return 1;
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
        const isMuted = user.isMuted;

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
              style={isMuted ? { filter: "grayscale(1)" } : {}}
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm mb-0.5">
                {userName}
                {user.unreadCount > 0 && !isMuted && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {user.unreadCount}
                  </span>
                )}
              </div>
            </div>
            <button
              className={`ml-2 px-2 py-1 text-xs rounded flex items-center gap-1 ${
                isMuted
                  ? "bg-gray-300 text-gray-700"
                  : "bg-yellow-400 text-black"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleMuteToggle(user, isMuted);
              }}
              disabled={loadingId === user._id}
            >
              {loadingId === user._id ? (
                <span className="loader w-3 h-3 border-2 border-t-2 border-gray-500 rounded-full animate-spin"></span>
              ) : isMuted ? (
                "Unmute"
              ) : (
                "Mute"
              )}
            </button>
            <div className="flex flex-col items-end gap-1 ml-2">
              <div className="text-xs text-gray-400">
                {user.lastMessageTimestamp
                  ? new Date(user.lastMessageTimestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : formatTime()}
              </div>
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default UserList;
