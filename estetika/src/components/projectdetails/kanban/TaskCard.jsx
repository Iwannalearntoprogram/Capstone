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
      className={`rounded-xl border border-[#d8deda] p-4 shadow-[0_16px_35px_-28px_rgba(15,23,42,0.45)] transition-all duration-200 ${
        isAdmin ? "cursor-default" : "cursor-grab"
      } ${isDragging ? "opacity-50" : "hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-28px_rgba(15,23,42,0.45)]"} ${
        isAdmin ? "bg-[#fafaf8]" : "bg-white"
      }`}
      style={style}
    >
      <h4 className="font-semibold text-slate-900">{task.title}</h4>
      <p className="mt-1 text-sm leading-6 text-slate-600">{task.description}</p>

      {isAdmin && (
        <div className="mt-3 text-xs italic text-slate-400">
          View only - Contact designers to modify
        </div>
      )}
    </div>
  );
}
