import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";

function RingProgressBar({
  progress,
  size = 108,
  stroke = 9,
  color = "#1D3C34",
  bg = "#dfe5e1",
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="block">
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
        dy=".32em"
        fontSize={size * 0.2}
        fill="#0f172a"
        fontWeight="700"
      >
        {typeof progress === "number" ? progress.toFixed(1) : "0.0"}%
      </text>
    </svg>
  );
}

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "Not scheduled";

const statusTone = {
  completed: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  "in-progress": "bg-amber-50 text-amber-800 border border-amber-200",
  backlog: "bg-slate-100 text-slate-700 border border-slate-200",
};

function PhaseCard({ phase, tasks }) {
  const [phaseProgress, setPhaseProgress] = useState(undefined);
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const fetchPhase = async () => {
      try {
        const token = Cookies.get("token");
        const response = await axios.get(`${serverUrl}/api/phase?id=${phase._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPhaseProgress(response.data.phase.progress);
      } catch (err) {
        setPhaseProgress(null);
      }
    };

    if (phase._id) {
      fetchPhase();
    }
  }, [phase._id, serverUrl]);

  const phaseTasks = tasks.filter((task) => task.phaseId === phase._id);
  const completedCount = phaseTasks.filter(
    (task) => task.status?.toLowerCase() === "completed"
  ).length;

  return (
    <article className="rounded-[18px] border border-[#e3ddd3] bg-white p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.35)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Phase
            </p>
            <h3 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900">
              {phase.title}
            </h3>
            <p className="text-sm text-slate-500">
              {formatDate(phase.startDate)} to {formatDate(phase.endDate)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[14px] border border-[#d8deda] bg-[#fafaf8] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Tasks
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {phaseTasks.length}
              </p>
            </div>
            <div className="rounded-[14px] border border-[#d8deda] bg-[#fafaf8] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Completed
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {completedCount}
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-w-[148px] flex-col items-center rounded-[16px] border border-[#d8deda] bg-[#fcfbf8] px-5 py-5">
          <RingProgressBar
            progress={typeof phaseProgress === "number" ? phaseProgress : 0}
          />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Phase progress
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-black/5 pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Tasks
          </h4>
          <p className="text-sm text-slate-500">
            {completedCount} of {phaseTasks.length} complete
          </p>
        </div>

        {phaseTasks.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#d8deda] bg-[#fafaf8] px-4 py-5 text-sm text-slate-500">
            No tasks for this phase.
          </div>
        ) : (
          <div className="max-h-[480px] overflow-y-auto pr-1">
            <ul className="space-y-3">
            {phaseTasks.map((task) => {
              const taskStatus = task.status?.toLowerCase() || "backlog";
              return (
                <li
                  key={task._id || task.name}
                  className="flex flex-col gap-3 rounded-[14px] border border-[#d8deda] bg-[#fcfcfb] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">
                      {task.title || task.name}
                    </p>
                    {task.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {task.description}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`inline-flex w-fit items-center rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${
                      statusTone[taskStatus] || statusTone.backlog
                    }`}
                  >
                    {task.status || "Backlog"}
                  </span>
                </li>
              );
            })}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

export default PhaseCard;
