import TaskCard from "./TaskCard";
import { useDroppable } from "@dnd-kit/core";

export default function Column({ column, tasks }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });
  return (
    <div className="flex-1  rounded-xl  flex flex-col">
      <h3 className="bg-[#eac5b1] p-4 py-2 font-bold rounded-tl-xl rounded-tr-xl">
        {column.title}
      </h3>
      <div className="bg-white shadow-md rounded-bl-xl rounded-br-xl">
        <div ref={setNodeRef} className="flex flex-col gap-4 p-4">
          {tasks.length === 0 && (
            <div className="text-center text-gray-500">
              No tasks in this column
            </div>
          )}
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}
