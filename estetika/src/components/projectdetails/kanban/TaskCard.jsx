import React from "react";

export default function TaskCard({ task }) {
  return (
    <div
      key={task.id}
      className="border-[1px] border-gray-300 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <h4 className="font-semibold">{task.title}</h4>
      <p className="text-sm"> {task.description}</p>
    </div>
  );
}
