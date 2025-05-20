import React, { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useOutletContext } from "react-router-dom";

function RingProgressBar({
  progress,
  size = 120,
  stroke = 12,
  color = "#1D3C34",
  bg = "#e5e7eb",
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="block mx-auto my-8">
      <circle
        stroke={bg}
        fill="transparent"
        strokeWidth={stroke}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{ transition: "stroke-dashoffset 0.5s" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fontSize={size * 0.22}
        fill="#222"
        fontWeight="bold"
      >
        {progress}%
      </text>
    </svg>
  );
}

function getPhaseProgress(tasks) {
  if (!tasks || !tasks.length) return 0;
  const total = tasks.reduce((sum, t) => sum + (t.progress || 0), 0);
  return Math.round(total / tasks.length);
}

function ProgressTab() {
  const { project } = useOutletContext();
  const [showModal, setShowModal] = useState(false);
  const [phaseForm, setPhaseForm] = useState({
    title: "",
    startDate: "",
    endDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhaseChange = (e) => {
    const { name, value } = e.target;
    setPhaseForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddPhase = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(
        "http://localhost:3000/api/phase",
        {
          title: phaseForm.title,
          startDate: new Date(phaseForm.startDate).toISOString(),
          endDate: new Date(phaseForm.endDate).toISOString(),
          projectId: project._id,
        },
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        }
      );
      setShowModal(false);
      setPhaseForm({ title: "", startDate: "", endDate: "" });
    } catch (err) {
      alert("Failed to add phase.");
    }
    setIsSubmitting(false);
  };

  // Use project.timeline as phases, fallback to empty array
  const phases = Array.isArray(project?.timeline) ? project.timeline : [];

  return (
    <div className="space-y-8">
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 h-full flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-4 text-gray-500 text-2xl cursor-pointer"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Add Phase</h2>
            <form onSubmit={handleAddPhase} className="flex flex-col gap-4">
              <label className="">
                Phase Title
                <input
                  type="text"
                  name="title"
                  placeholder="Phase Title"
                  className="border rounded p-2 mt-1 w-full outline-black"
                  value={phaseForm.title}
                  onChange={handlePhaseChange}
                  required
                />
              </label>
              <label className="">
                Start Date
                <input
                  type="date"
                  name="startDate"
                  className="border rounded p-2 mt-1 w-full outline-black"
                  value={phaseForm.startDate}
                  onChange={handlePhaseChange}
                  required
                />
              </label>
              <label className="">
                End Date
                <input
                  type="date"
                  name="endDate"
                  className="border rounded p-2 mt-1 w-full outline-black"
                  value={phaseForm.endDate}
                  onChange={handlePhaseChange}
                  required
                />
              </label>
              <button
                type="submit"
                className="bg-[#1D3C34] text-white rounded p-2 font-semibold hover:bg-[#16442A] transition cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Phase"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button
          className="bg-[#1D3C34] text-white px-4 py-2 rounded font-semibold hover:bg-[#16442A] transition cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          Add Phase
        </button>
      </div>
      {phases.length === 0 && (
        <div className="text-center text-gray-500">No phases yet.</div>
      )}
      {phases.map((phase, idx) => (
        <div key={phase._id || idx} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-2">{phase.title}</h2>
          <div className="text-sm text-gray-500 mb-2">
            {phase.startDate
              ? `Start: ${new Date(phase.startDate).toLocaleDateString()}`
              : ""}
            {phase.endDate
              ? ` | End: ${new Date(phase.endDate).toLocaleDateString()}`
              : ""}
          </div>
          <RingProgressBar progress={getPhaseProgress(phase.tasks || [])} />
          <ul className="mt-4 space-y-2">
            {(phase.tasks || []).length === 0 && (
              <li className="text-gray-400 italic">No tasks for this phase.</li>
            )}
            {(phase.tasks || []).map((task) => (
              <li
                key={task._id || task.name}
                className="flex justify-between items-center"
              >
                <span>{task.title || task.name}</span>
                <span className="text-sm text-gray-600">
                  {task.progress ?? 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default ProgressTab;
