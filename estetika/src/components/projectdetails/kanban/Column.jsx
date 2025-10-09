import TaskCard from "./TaskCard";
import { useDroppable } from "@dnd-kit/core";
import { useState, useEffect, useCallback } from "react";
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
  const [userRole, setUserRole] = useState(null);
  const initialPhaseId = project?.timeline?.[0]?._id || "";
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: users[0],
    phaseId: initialPhaseId,
    startDate: "",
    endDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // If the component mounted before project.timeline was available, set a default phase when it arrives
  useEffect(() => {
    if (!newTask.phaseId && project?.timeline?.length) {
      setNewTask((prev) => ({ ...prev, phaseId: project.timeline[0]._id }));
    }
  }, [project?.timeline, newTask.phaseId]);

  // Auto-clear phase error if a valid phaseId is now set
  useEffect(() => {
    if (errorMsg === "Please select a phase first" && newTask.phaseId) {
      setErrorMsg("");
    }
  }, [newTask.phaseId, errorMsg]);

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  // Get user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
  }, []);

  const resetTaskFields = useCallback(() => {
    // Preserve the chosen phase so validation ranges stay consistent
    setNewTask((prev) => ({
      title: "",
      description: "",
      assignedTo: prev.assignedTo,
      phaseId: prev.phaseId || initialPhaseId,
      startDate: "",
      endDate: "",
    }));
  }, [initialPhaseId]);

  const handleSaveTask = async () => {
    // Prevent admin from creating tasks
    if (userRole === "admin") {
      alert("Admins cannot create tasks. Only designers can manage tasks.");
      return;
    }

    setErrorMsg("");

    // Basic validation
    if (!newTask.title.trim()) {
      setErrorMsg("Title is required");
      return;
    }

    if (!newTask.phaseId) {
      setErrorMsg("Please select a phase first");
      return;
    }

    if (
      newTask.startDate &&
      newTask.endDate &&
      newTask.endDate < newTask.startDate
    ) {
      setErrorMsg("End date cannot be before start date");
      return;
    }

    // Ensure dates fall within phase boundaries
    if (selectedPhase) {
      const phaseStartDate = new Date(selectedPhase.startDate)
        .toISOString()
        .slice(0, 10);
      const phaseEndDate = new Date(selectedPhase.endDate)
        .toISOString()
        .slice(0, 10);
      if (
        newTask.startDate &&
        (newTask.startDate < phaseStartDate || newTask.startDate > phaseEndDate)
      ) {
        setErrorMsg("Start date must be within phase range");
        return;
      }
      if (
        newTask.endDate &&
        (newTask.endDate < phaseStartDate || newTask.endDate > phaseEndDate)
      ) {
        setErrorMsg("End date must be within phase range");
        return;
      }
    }

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
      setSubmitting(true);
      await axios.post(`${serverUrl}/api/task`, body, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });
      // Close modal and hard reload so task list refreshes globally
      setModalOpen(false);
      setSubmitting(false);
      // Small timeout lets modal closing animation finish before reload
      setTimeout(() => {
        window.location.reload();
      }, 150);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to add task.");
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setClosing(true);
    setTimeout(() => {
      setModalOpen(false);
      setClosing(false);
    }, 300);
  };

  const handleAddTaskClick = () => {
    if (userRole === "admin") {
      alert("Admins cannot create tasks. Only designers can manage tasks.");
      return;
    }
    setModalOpen(true);
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

  const isAdmin = userRole === "admin";

  return (
    <div className="flex-1 rounded-xl flex flex-col">
      <h3 className="bg-[#eac5b1] p-4 py-2 font-bold rounded-tl-xl rounded-tr-xl">
        {column.title}
      </h3>
      <div className="bg-white shadow-md rounded-bl-xl rounded-br-xl">
        <div ref={setNodeRef} className="flex flex-col gap-4 p-4">
          {!isAdmin && (
            <button
              onClick={handleAddTaskClick}
              className="border-[1px] border-dashed border-[#145c4b] p-4 py-2 rounded-lg shadow-sm bg-white hover:bg-gray-50 cursor-pointer flex items-center justify-center text-gray-500 font-medium transition"
              type="button"
            >
              + Add Task
            </button>
          )}
          {isAdmin && tasks.length === 0 && (
            <div className="text-center text-gray-500 p-4 border border-dashed border-gray-300 rounded-lg">
              <p className="mb-1">No tasks in this column</p>
              <p className="text-sm text-gray-400">
                Only designers can create and manage tasks
              </p>
            </div>
          )}
          {/* Show regular no tasks message if not admin */}
          {!isAdmin && tasks.length === 0 && (
            <div className="text-center text-gray-500">
              No tasks in this column
            </div>
          )}
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} userRole={userRole} />
          ))}
        </div>
      </div>

      {/* Modal - Only show if not admin */}
      {modalOpen && !isAdmin && (
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
        <h2 className="text-lg font-semibold mb-2">Add Task</h2>
        {selectedPhase && (
          <p className="text-xs text-gray-500 mb-4">
            Phase window: {phaseStart || "—"} to {phaseEnd || "—"}
          </p>
        )}
        {errorMsg && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {errorMsg}
          </div>
        )}
        <label className="block mb-2">Phase:</label>
        <select
          value={newTask.phaseId}
          onChange={(e) => {
            const val = e.target.value;
            setNewTask((prev) => ({
              ...prev,
              phaseId: val,
              // reset dates so user reselects within the new phase boundaries
              startDate: "",
              endDate: "",
            }));
            if (errorMsg === "Please select a phase first") setErrorMsg("");
          }}
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

        <div className="flex justify-end gap-2">
          <button
            onClick={handleSaveTask}
            disabled={submitting}
            className={`px-4 py-2 bg-[#1D3C34] text-white rounded-md hover:bg-[#145c4b] transition disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? "Saving..." : "Add Task"}
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
