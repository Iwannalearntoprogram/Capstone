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
    <div className="min-w-0 flex flex-col rounded-[18px] border border-[#e3ddd3] bg-white shadow-[0_24px_60px_-45px_rgba(15,23,42,0.35)]">
      <h3 className="rounded-tl-[18px] rounded-tr-[18px] border-b border-[#d9e5df] bg-[#eef4f1] px-4 py-3 font-semibold text-[#1d3c34]">
        {column.title}
      </h3>
      <div className="rounded-bl-[18px] rounded-br-[18px] bg-white">
        <div ref={setNodeRef} className="flex flex-col gap-4 p-4">
          {!isAdmin && (
            <button
              onClick={handleAddTaskClick}
              className="flex items-center justify-center rounded-xl border border-dashed border-[#1d3c34]/35 bg-[#f7faf8] px-4 py-3 font-medium text-[#1d3c34] transition hover:border-[#1d3c34]/50 hover:bg-white"
              type="button"
            >
              + Add Task
            </button>
          )}
          {isAdmin && tasks.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#d8deda] bg-[#fafaf8] p-5 text-center text-slate-500">
              <p className="mb-1">No tasks in this column</p>
              <p className="text-sm text-slate-400">
                Only designers can create and manage tasks
              </p>
            </div>
          )}
          {/* Show regular no tasks message if not admin */}
          {!isAdmin && tasks.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#d8deda] bg-[#fafaf8] p-5 text-center text-slate-500">
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
        className={`fixed top-1/2 left-1/2 z-50 w-[90%] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-white/50 bg-[#fcfbf8] p-6 shadow-[0_40px_120px_-45px_rgba(15,23,42,0.55)] ${
          closing ? "opacity-0 transition-opacity duration-300" : "opacity-100"
        }`}
        overlayClassName="fixed top-0 left-0 w-full h-full bg-black/20 z-50 backdrop-blur-xs"
        shouldCloseOnOverlayClick={false}
        ariaHideApp={false}
      >
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Add Task</h2>
        {selectedPhase && (
          <p className="mb-4 text-xs text-slate-500">
            Phase window: {phaseStart || "—"} to {phaseEnd || "—"}
          </p>
        )}
        {errorMsg && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-2 text-sm text-red-600">
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
          className="mb-4 w-full rounded-xl border border-[#d8deda] bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
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
          className="mb-4 w-full rounded-xl border border-[#d8deda] bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <label className="block mb-2">Task Description:</label>
        <textarea
          placeholder="Task Description"
          value={newTask.description}
          onChange={(e) =>
            setNewTask({ ...newTask, description: e.target.value })
          }
          className="mb-4 w-full resize-none rounded-xl border border-[#d8deda] bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
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
          className="mb-4 w-full rounded-xl border border-[#d8deda] bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <label className="block mb-2">Task End:</label>
        <input
          type="date"
          value={newTask.endDate || ""}
          min={phaseStart}
          max={phaseEnd}
          onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
          className="mb-4 w-full rounded-xl border border-[#d8deda] bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={handleSaveTask}
            disabled={submitting}
            className={`rounded-full bg-[#1D3C34] px-4 py-2 text-white transition hover:bg-[#145c4b] disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {submitting ? "Saving..." : "Add Task"}
          </button>
          <button
            onClick={closeModal}
            className="rounded-full bg-slate-200 px-4 py-2 text-slate-800 transition hover:bg-slate-300"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
