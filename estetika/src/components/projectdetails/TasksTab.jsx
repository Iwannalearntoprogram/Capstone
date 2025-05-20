import { useState } from "react";
import Column from "./kanban/Column";
import { DndContext } from "@dnd-kit/core";
import { useOutletContext } from "react-router-dom";

const columns = [
  { id: "backlog", title: "Backlog" },
  { id: "in-progress", title: "In Progress" },
  { id: "completed", title: "Completed" },
];

function TasksTab() {
  const { project } = useOutletContext();

  // Use tasks from backend
  const tasks = Array.isArray(project?.tasks) ? project.tasks : [];

  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (!over) return;
    // You can implement drag logic here if needed
  };

  return (
    <div className="flex gap-4">
      <DndContext onDragEnd={handleDragEnd}>
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            project={project}
            tasks={tasks.filter((task) => column.id === task.status)}
          />
        ))}
      </DndContext>
    </div>
  );
}

export default TasksTab;
