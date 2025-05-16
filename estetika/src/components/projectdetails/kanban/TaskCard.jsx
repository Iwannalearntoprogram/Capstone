import React from "react";
import { useDraggable } from "@dnd-kit/core";

export default function TaskCard({ task }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({
      id: task.id,
    });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`border-[1px] border-gray-300 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-white cursor-grab ${
        isDragging ? "opacity-50" : ""
      }`}
      style={style}
    >
      <h4 className="font-semibold">{task.title}</h4>
      <p className="text-sm">{task.description}</p>
    </div>
  );
}
