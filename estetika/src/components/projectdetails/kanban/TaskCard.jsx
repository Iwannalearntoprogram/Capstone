import React, { useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";

export default function TaskCard({ task, userRole }) {
  const [localUserRole, setLocalUserRole] = useState(userRole);

  // Get user role from localStorage if not passed as prop
  useEffect(() => {
    if (!userRole) {
      const role = localStorage.getItem("role");
      setLocalUserRole(role);
    } else {
      setLocalUserRole(userRole);
    }
  }, [userRole]);

  const isAdmin = localUserRole === "admin";

  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({
      id: task._id || task.id,
      disabled: isAdmin,
    });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...(isAdmin ? {} : attributes)}
      {...(isAdmin ? {} : listeners)}
      className={`border-[1px] border-gray-300 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-white ${
        isAdmin ? "cursor-default" : "cursor-grab"
      } ${isDragging ? "opacity-50" : ""} ${
        isAdmin ? "bg-gray-50" : "bg-white"
      }`}
      style={style}
    >
      <h4 className="font-semibold">{task.title}</h4>
      <p className="text-sm text-gray-600">{task.description}</p>

      {isAdmin && (
        <div className="mt-2 text-xs text-gray-500 italic">
          View only - Contact designers to modify
        </div>
      )}
    </div>
  );
}
