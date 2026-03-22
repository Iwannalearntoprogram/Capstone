import React, { useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";

const ChatWindow = ({ messages, userId }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex h-full min-h-[20rem] flex-col items-center justify-center text-gray-400">
        <span>No messages yet. Start the conversation!</span>
      </div>
    );
  }

  return (
    <div className="mb-2 flex h-full min-h-0 flex-col overflow-y-auto rounded p-2">
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} message={msg} isSelf={msg.sender === userId} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;
