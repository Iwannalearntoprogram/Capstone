import React from "react";
import { FaFilePdf, FaFileAlt } from "react-icons/fa";

const MessageBubble = ({ message, isSelf }) => {
  const isFileMessage = message.fileLink && message.fileType;

  const getFileIcon = (fileType) => {
    if (fileType === "application/pdf") return <FaFilePdf size={16} />;
    return <FaFileAlt size={16} />;
  };

  return (
    <div className={`flex ${isSelf ? "justify-end" : "justify-start"} mt-2`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
          isSelf
            ? "bg-blue-500 text-white rounded-br-md"
            : "bg-white text-gray-900 rounded-bl-md border border-gray-100"
        }`}
      >
        {isFileMessage ? (
          message.fileType.startsWith("image/") ? (
            <img
              src={message.fileLink}
              alt="Uploaded file"
              className="max-w-full rounded-md"
              onError={(e) => (e.target.src = "/path/to/fallback-image.png")}
            />
          ) : (
            <div className="flex items-center gap-2">
              {getFileIcon(message.fileType)}
              <a
                href={message.fileLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`underline ${
                  isSelf ? "text-white" : "text-blue-500"
                }`}
              >
                {message.fileName || "Download File"}
              </a>
            </div>
          )
        ) : (
          <div className="text-sm leading-relaxed">{message.content}</div>
        )}
        <div
          className={`text-xs mt-1 ${
            isSelf ? "text-blue-100" : "text-gray-400"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
