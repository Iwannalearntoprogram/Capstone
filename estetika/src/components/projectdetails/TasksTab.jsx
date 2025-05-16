import { useState } from "react";
import Column from "./kanban/Column";

const columns = [
  { id: "backlog", title: "Backlog" },
  { id: "inProgress", title: "In Progress" },
  { id: "completed", title: "Completed" },
];

const initialTasks = [
  {
    id: 1,
    title: "Task 1",
    description: "Description for Task 1",
    status: "backlog",
    assignedTo: "Alice",
    dueDate: "2023-10-01",
  },
  {
    id: 2,
    title: "Task 2",
    description: "Description for Task 2",
    status: "inProgress",
    assignedTo: "Bob",
    dueDate: "2023-10-02",
  },
  {
    id: 3,
    title: "Task 3",
    description: "Description for Task 3",
    status: "completed",
    assignedTo: "Charlie",
    dueDate: "2023-10-03",
  },
];

function TasksTab() {
  const [tasks, setTasks] = useState(initialTasks);

  return (
    <div className="flex gap-4">
      {columns.map((column) => (
        <Column
          column={column}
          tasks={tasks.filter((task) => column.id === task.status)}
        />
      ))}
    </div>
  );
}

export default TasksTab;
