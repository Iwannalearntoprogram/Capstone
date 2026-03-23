import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";

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
        {typeof progress === "number" ? progress.toFixed(1) : "0.0"}%
      </text>
    </svg>
  );
}

function PhaseCard({ phase, tasks, projectId }) {
  const [phaseProgress, setPhaseProgress] = useState(undefined);
  const [overallProgress, setOverallProgress] = useState(undefined);
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const fetchPhase = async () => {
      try {
        const token = Cookies.get("token");
        const response = await axios.get(
          `${serverUrl}/api/phase?id=${phase._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPhaseProgress(response.data.phase.progress);
      } catch (err) {
        setPhaseProgress(null);
      }
    };
    if (phase._id) fetchPhase();
  }, [phase._id]);

  const phaseTasks = tasks.filter((task) => task.phaseId === phase._id);

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-lg sm:p-6">
      <h2 className="text-lg font-bold mb-2">{phase.title}</h2>
      <div className="mb-2 flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:items-center sm:gap-2">
        {phase.startDate && (
          <span>Start: {new Date(phase.startDate).toLocaleDateString()}</span>
        )}
        {phase.endDate && (
          <span>End: {new Date(phase.endDate).toLocaleDateString()}</span>
        )}
      </div>
      <RingProgressBar
        progress={typeof phaseProgress === "number" ? phaseProgress : 0}
      />
      {overallProgress !== undefined && overallProgress !== null && (
        <div className="mt-2 text-green-700 font-semibold text-center">
          Overall Project Progress: {overallProgress.toFixed(2)}%
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {phaseTasks.length === 0 && (
          <li className="text-gray-400 italic">No tasks for this phase.</li>
        )}
        {phaseTasks.length > 0 && <h3 className="font-semibold">Tasks</h3>}
        {phaseTasks.map((task) => (
          <li
            key={task._id || task.name}
            className="flex flex-col gap-1 rounded-lg border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="break-words">{task.title || task.name}</span>
            <span className="text-sm text-gray-600">{task.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PhaseCard;
