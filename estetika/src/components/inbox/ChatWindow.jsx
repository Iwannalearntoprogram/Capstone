import React, { useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";

const ChatWindow = ({ messages, userId }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log("Messages updated:", messages);
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col h-[45rem] items-center justify-center text-gray-400">
        <span>No messages yet. Start the conversation!</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[45rem] overflow-y-auto p-2 rounded mb-2 ">
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} message={msg} isSelf={msg.sender === userId} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;
