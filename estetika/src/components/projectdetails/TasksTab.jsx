import { useState, useEffect } from "react";
import Column from "./kanban/Column";
import { DndContext } from "@dnd-kit/core";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

const columns = [
  { id: "backlog", title: "Backlog" },
  { id: "in-progress", title: "In Progress" },
  { id: "completed", title: "Completed" },
];

function TasksTab() {
  const { project } = useOutletContext();
  const [tasks, setTasks] = useState(
    Array.isArray(project?.tasks) ? project.tasks : []
  );

  // Update tasks state if project.tasks changes
  useEffect(() => {
    setTasks(Array.isArray(project?.tasks) ? project.tasks : []);
  }, [project?.tasks]);

  const handleDragEnd = async (e) => {
    const { active, over } = e;
    if (!over) return;

    // Find the dragged task
    const taskId = active.id;
    const newStatus = over.id;

    // Optimistically update UI
    setTasks((prev) =>
      prev.map((task) =>
        (task._id || task.id) === taskId ? { ...task, status: newStatus } : task
      )
    );

    // Send PUT request to update status in backend
    try {
      const token = Cookies.get("token");
      await axios.put(
        `http://localhost:3000/api/task?id=${taskId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      alert("Failed to update task status.");
    }
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
