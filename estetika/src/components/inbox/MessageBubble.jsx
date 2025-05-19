import React from "react";

const MessageBubble = ({ message, isSelf }) => (
  <div
    className={`max-w-[70%] mb-2 p-2 rounded-2xl shadow text-sm ${
      isSelf ? "bg-gray-200 self-end" : "bg-gray-100 self-start"
    }`}
  >
    <div>{message.content}</div>
    <div className="text-[10px] text-right mt-1 text-gray-500">
      {new Date(message.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </div>
  </div>
);

export default MessageBubble;
