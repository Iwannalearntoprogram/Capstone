import React, { useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";

const ChatWindow = ({ messages, username }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-2 border border-gray-200 rounded mb-2 bg-white">
      {messages.map((msg, idx) => (
        <MessageBubble
          key={idx}
          message={msg}
          isSelf={msg.sender === username}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;
