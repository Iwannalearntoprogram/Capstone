import TaskCard from "./TaskCard";

export default function Column({ column, tasks }) {
  return (
    <div className="flex-1 bg-white rounded-xl shadow  ">
      <h3 className="bg-[#eac5b1] p-4 py-2 font-bold rounded-tl-xl rounded-tr-xl">
        {column.title}
      </h3>
      <div className="flex flex-col gap-4 p-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
