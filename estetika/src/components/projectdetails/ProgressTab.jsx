import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useOutletContext } from "react-router-dom";
import PhaseCard from "./phases/PhaseCard";

// Progress ring component
function RingProgressBar({
  progress,
  size = 140,
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
        {typeof progress === "number" ? progress.toFixed(1) : "0"}%
      </text>
    </svg>
  );
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

  const phases = Array.isArray(project?.timeline) ? project.timeline : [];
  const tasks = Array.isArray(project?.tasks) ? project.tasks : [];

  const [overallProgress, setOverallProgress] = useState(undefined);

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const fetchOverallProgress = async () => {
      if (!project?._id) return;
      try {
        const token = Cookies.get("token");
        const response = await axios.get(
          `${serverUrl}/api/phase?projectId=${project._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const phaseArr = response.data.phase || [];
        if (phaseArr.length > 0) {
          const total = phaseArr.reduce(
            (sum, p) => sum + (typeof p.progress === "number" ? p.progress : 0),
            0
          );
          setOverallProgress(total / phaseArr.length);
        } else {
          setOverallProgress(0);
        }
      } catch (err) {
        setOverallProgress(null);
      }
    };
    fetchOverallProgress();
  }, [project?._id]);
  // ------------------------------------------

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
        `${serverUrl}/api/phase`,
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

  return (
    <div className="space-y-8 bg-white rounded-xl shadow p-6">
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

      {overallProgress !== undefined && overallProgress !== null && (
        <div className="flex flex-col items-center">
          <RingProgressBar progress={overallProgress} />
          <div className=" font-semibold text-lg">Overall Project Progress</div>
        </div>
      )}

      {phases.length === 0 && (
        <div className="text-center text-gray-500">No phases yet.</div>
      )}
      {phases.map((phase, idx) => (
        <PhaseCard
          key={phase._id || idx}
          phase={phase}
          tasks={tasks}
          projectId={project._id}
        />
      ))}
    </div>
  );
}

export default ProgressTab;
