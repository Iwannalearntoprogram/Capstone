import React, { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const phases = [
  {
    name: "Phase 1",
    label: "Planning & Design",
    tasks: [
      {
        name: "Requirement Gathering",
        startMonth: 0,
        endMonth: 1,
        progress: 100,
      },
      { name: "Wireframing", startMonth: 1, endMonth: 2, progress: 60 },
      { name: "UI Design", startMonth: 2, endMonth: 3, progress: 40 },
      {
        name: "Technical Specification",
        startMonth: 3,
        endMonth: 3,
        progress: 0,
      },
    ],
  },
  {
    name: "Phase 2",
    label: "Development",
    tasks: [
      {
        name: "Frontend Development",
        startMonth: 4,
        endMonth: 6,
        progress: 30,
      },
      { name: "Backend Development", startMonth: 4, endMonth: 7, progress: 10 },
      { name: "API Integration", startMonth: 6, endMonth: 8, progress: 0 },
      { name: "Unit Testing", startMonth: 7, endMonth: 8, progress: 0 },
    ],
  },
  {
    name: "Phase 3",
    label: "Testing & QA",
    tasks: [
      { name: "System Testing", startMonth: 8, endMonth: 9, progress: 0 },
      {
        name: "User Acceptance Testing",
        startMonth: 9,
        endMonth: 10,
        progress: 0,
      },
      { name: "Bug Fixing", startMonth: 9, endMonth: 10, progress: 0 },
    ],
  },
  {
    name: "Phase 4",
    label: "Deployment",
    tasks: [
      { name: "Staging Deployment", startMonth: 10, endMonth: 10, progress: 0 },
      {
        name: "Production Deployment",
        startMonth: 11,
        endMonth: 11,
        progress: 0,
      },
    ],
  },
  {
    name: "Phase 5",
    label: "Maintenance & Support",
    tasks: [
      { name: "Monitoring", startMonth: 11, endMonth: 11, progress: 0 },
      { name: "Support", startMonth: 11, endMonth: 11, progress: 0 },
    ],
  },
];

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
  if (!tasks.length) return 0;
  const total = tasks.reduce((sum, t) => sum + t.progress, 0);
  return Math.round(total / tasks.length);
}

function ProgressTab({ projectId = "6825d4702fbf8ffc15b924e8" }) {
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
          projectId: projectId,
        },
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        }
      );
      setShowModal(false);
      setPhaseForm({ title: "", startDate: "", endDate: "" });
      // Optionally, refetch phases here
    } catch (err) {
      alert("Failed to add phase.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 h-full flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-4 text-gray-500 text-2xl"
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
                  className="border rounded p-2 mt-1 w-full"
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
                  className="border rounded p-2 mt-1 w-full"
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
                  className="border rounded p-2 mt-1 w-full"
                  value={phaseForm.endDate}
                  onChange={handlePhaseChange}
                  required
                />
              </label>
              <button
                type="submit"
                className="bg-[#1D3C34] text-white rounded p-2 font-semibold hover:bg-[#16442A] transition"
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
          className="bg-[#1D3C34] text-white px-4 py-2 rounded font-semibold hover:bg-[#16442A] transition"
          onClick={() => setShowModal(true)}
        >
          Add Phase
        </button>
      </div>
      {phases.map((phase, idx) => (
        <div key={phase.name} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-2">{phase.label}</h2>
          <RingProgressBar progress={getPhaseProgress(phase.tasks)} />
          <ul className="mt-4 space-y-2">
            {phase.tasks.map((task) => (
              <li key={task.name} className="flex justify-between items-center">
                <span>{task.name}</span>
                <span className="text-sm text-gray-600">{task.progress}%</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default ProgressTab;
