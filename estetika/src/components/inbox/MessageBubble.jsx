import React from "react";

const MessageBubble = ({ message, isSelf }) => (
  <div className={`flex ${isSelf ? "justify-end" : "justify-start"} mt-2`}>
    <div
      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
        isSelf
          ? "bg-blue-500 text-white rounded-br-md"
          : "bg-white text-gray-900 rounded-bl-md border border-gray-100"
      }`}
    >
      <div className="text-sm leading-relaxed">{message.content}</div>
      <div
        className={`text-xs mt-1 ${isSelf ? "text-blue-100" : "text-gray-400"}`}
      >
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  </div>
);

export default MessageBubble;
