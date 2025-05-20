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
        {typeof progress === "number" ? progress.toFixed(2) : "0.00"}%
      </text>
    </svg>
  );
}

function getPhaseProgress(tasks) {
  if (!tasks || !tasks.length) return 0;
  const total = tasks.reduce((sum, t) => sum + (t.progress || 0), 0);
  return Math.round(total / tasks.length);
}

function PhaseCard({ phase, tasks }) {
  const [phaseProgress, setPhaseProgress] = useState(undefined);

  useEffect(() => {
    const fetchPhase = async () => {
      try {
        const token = Cookies.get("token");
        const response = await axios.get(
          `http://localhost:3000/api/phase?id=${phase._id}`,
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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold mb-2">{phase.title}</h2>
      <div className="text-sm text-gray-500 mb-2">
        {phase.startDate
          ? `Start: ${new Date(phase.startDate).toLocaleDateString()}`
          : ""}
        {phase.endDate
          ? ` | End: ${new Date(phase.endDate).toLocaleDateString()}`
          : ""}
      </div>
      <RingProgressBar
        progress={typeof phaseProgress === "number" ? phaseProgress : 0}
      />
      <ul className="mt-4 space-y-2">
        {phaseTasks.length === 0 && (
          <li className="text-gray-400 italic">No tasks for this phase.</li>
        )}
        {phaseTasks.length > 0 && <h3 className="font-semibold">Tasks</h3>}
        {phaseTasks.map((task) => (
          <li
            key={task._id || task.name}
            className="flex justify-between items-center"
          >
            <span>{task.title || task.name}</span>
            <span className="text-sm text-gray-600">{task.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PhaseCard;
