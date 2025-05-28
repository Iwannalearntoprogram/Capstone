import TaskCard from "./TaskCard";
import { useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import Modal from "react-modal"; // Make sure react-modal is installed
import axios from "axios";
import Cookies from "js-cookie";

const users = ["Alice", "Bob", "Charlie"]; // Example users

export default function Column({ column, tasks, project }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: users[0],
    phaseId: project?.timeline?.[0]?._id || "",
  });

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  const handleSaveTask = async () => {
    const body = {
      title: newTask.title,
      description: newTask.description,
      status: column.id,
      startDate: newTask.startDate
        ? new Date(newTask.startDate).toISOString()
        : undefined,
      endDate: newTask.endDate
        ? new Date(newTask.endDate).toISOString()
        : undefined,
      projectId: project._id,
      phaseId: newTask.phaseId,
    };

    try {
      await axios.post(`${serverUrl}/api/task`, body, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });

      setClosing(true);
      setTimeout(() => {
        setModalOpen(false);
        setClosing(false);
        setNewTask({
          title: "",
          description: "",
          assignedTo: users[0],
          phaseId: project?.timeline?.[0]?._id || "",
          startDate: "",
          endDate: "",
        });
      }, 300);
      location.reload();
    } catch (err) {
      alert("Failed to add task.");
    }
  };

  const closeModal = () => {
    setClosing(true);
    setTimeout(() => {
      setModalOpen(false);
      setClosing(false);
    }, 300);
  };

  // Find the selected phase object
  const selectedPhase = Array.isArray(project?.timeline)
    ? project.timeline.find((p) => p._id === newTask.phaseId)
    : null;

  const phaseStart = selectedPhase?.startDate
    ? new Date(selectedPhase.startDate).toISOString().slice(0, 10)
    : "";
  const phaseEnd = selectedPhase?.endDate
    ? new Date(selectedPhase.endDate).toISOString().slice(0, 10)
    : "";

  return (
    <div className="flex-1 rounded-xl flex flex-col">
      <h3 className="bg-[#eac5b1] p-4 py-2 font-bold rounded-tl-xl rounded-tr-xl">
        {column.title}
      </h3>
      <div className="bg-white shadow-md rounded-bl-xl rounded-br-xl">
        <div ref={setNodeRef} className="flex flex-col gap-4 p-4">
          <button
            onClick={() => setModalOpen(true)}
            className="border-[1px] border-dashed border-[#145c4b] p-4 py-2 rounded-lg shadow-sm bg-white hover:bg-gray-50 cursor-pointer flex items-center justify-center text-gray-500 font-medium transition"
            type="button"
          >
            + Add Task
          </button>
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

      {/* Modal */}
      {modalOpen && (
        <div
          className={`fixed top-0 left-0 w-full h-full bg-black/20 z-50 ${
            closing
              ? "opacity-0 transition-opacity duration-300"
              : "opacity-100"
          }`}
          onClick={closeModal}
        />
      )}

      <Modal
        isOpen={modalOpen || closing}
        onRequestClose={closeModal}
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 w-[90%] max-w-[400px] rounded-lg shadow-lg z-50 ${
          closing ? "opacity-0 transition-opacity duration-300" : "opacity-100"
        }`}
        overlayClassName="fixed top-0 left-0 w-full h-full bg-black/20 z-50 backdrop-blur-xs"
        shouldCloseOnOverlayClick={false}
        ariaHideApp={false}
      >
        <h2 className="text-lg font-semibold mb-4">Add Task</h2>
        <label className="block mb-2">Phase:</label>
        <select
          value={newTask.phaseId}
          onChange={(e) => setNewTask({ ...newTask, phaseId: e.target.value })}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        >
          {Array.isArray(project?.timeline) && project.timeline.length > 0 ? (
            project.timeline.map((phase) => (
              <option key={phase._id} value={phase._id}>
                {phase.title}
              </option>
            ))
          ) : (
            <option value="">
              Please create a Phase first in progress tab
            </option>
          )}
        </select>
        <label className="block mb-2">Task:</label>
        <input
          type="text"
          placeholder="Task Title"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <label className="block mb-2">Task Description:</label>
        <textarea
          placeholder="Task Description"
          value={newTask.description}
          onChange={(e) =>
            setNewTask({ ...newTask, description: e.target.value })
          }
          className="w-full p-2 mb-4 border resize-none border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <label className="block mb-2">Task Start:</label>
        <input
          type="date"
          value={newTask.startDate || ""}
          min={phaseStart}
          max={phaseEnd}
          onChange={(e) =>
            setNewTask({ ...newTask, startDate: e.target.value })
          }
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <label className="block mb-2">Task End:</label>
        <input
          type="date"
          value={newTask.endDate || ""}
          min={phaseStart}
          max={phaseEnd}
          onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />
        {/* 
        <label className="block mb-2">Assign To:</label>
        <select
          value={newTask.assignedTo}
          onChange={(e) =>
            setNewTask({ ...newTask, assignedTo: e.target.value })
          }
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        >
          {users.map((user) => (
            <option key={user} value={user}>
              {user}
            </option>
          ))}
        </select> */}

        <div className="flex justify-end gap-2">
          <button
            onClick={handleSaveTask}
            className="px-4 py-2 bg-[#1D3C34] text-white rounded-md hover:bg-[#145c4b] transition"
          >
            Add Task
          </button>
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
