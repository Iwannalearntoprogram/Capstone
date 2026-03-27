import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { FiCalendar, FiEdit2, FiFlag, FiLayers, FiPlus } from "react-icons/fi";
import { useOutletContext } from "react-router-dom";
import PhaseCard from "./phases/PhaseCard";
import EditPhasesModal from "../../components/project/EditPhasesModal";
import {
  validateDateOrder,
  validateNotPastDate,
  validateRequiredText,
} from "../../utils/validation";

function RingProgressBar({
  progress,
  size = 138,
  stroke = 10,
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

function ProgressTab() {
  const { project } = useOutletContext();
  const [isPhasesEditOpen, setIsPhasesEditOpen] = useState(false);
  const [phasesEditData, setPhasesEditData] = useState([]);
  const [isPhasesSaving, setIsPhasesSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [phaseForm, setPhaseForm] = useState({
    title: "",
    startDate: "",
    endDate: "",
  });
  const [phaseFormErrors, setPhaseFormErrors] = useState({});
  const [phaseFormMessage, setPhaseFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overallProgress, setOverallProgress] = useState(undefined);

  const phases = Array.isArray(project?.timeline) ? project.timeline : [];
  const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
  }, []);

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
            (sum, phase) =>
              sum + (typeof phase.progress === "number" ? phase.progress : 0),
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
  }, [project?._id, serverUrl]);

  const openPhasesEditModal = () => {
    if (phases && Array.isArray(phases)) {
      setPhasesEditData(
        phases.map((phase) => ({
          _id: phase._id,
          title: phase.title || "",
          startDate: phase.startDate ? phase.startDate.slice(0, 10) : "",
          endDate: phase.endDate ? phase.endDate.slice(0, 10) : "",
        }))
      );
      setIsPhasesEditOpen(true);
    }
  };

  const closePhasesEditModal = () => setIsPhasesEditOpen(false);

  const handleChangePhase = (idx, newPhase) => {
    setPhasesEditData((prev) =>
      prev.map((phase, i) => (i === idx ? { ...phase, ...newPhase } : phase))
    );
  };

  const handleRemovePhaseEdit = (idx) => {
    setPhasesEditData((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePhasesEditSubmit = async (e) => {
    e.preventDefault();

    for (const phase of phasesEditData) {
      if (phase.endDate < phase.startDate) {
        alert(`End date cannot be before start date for phase: ${phase.title}`);
        setIsPhasesSaving(false);
        return;
      }
      if (!phase.title || phase.title.trim() === "") {
        alert("Phase title cannot be empty.");
        setIsPhasesSaving(false);
        return;
      }
    }

    setIsPhasesSaving(true);
    try {
      const token = Cookies.get("token");
      const updateRequests = phasesEditData
        .map((edited, idx) => {
          const original = phases[idx];
          const payload = {};

          if (edited.title !== (original.title || "")) {
            payload.title = edited.title;
          }
          if (
            edited.startDate !==
            (original.startDate ? original.startDate.slice(0, 10) : "")
          ) {
            payload.startDate = edited.startDate;
          }
          if (
            edited.endDate !==
            (original.endDate ? original.endDate.slice(0, 10) : "")
          ) {
            payload.endDate = edited.endDate;
          }

          if (Object.keys(payload).length > 0) {
            return axios.put(
              `${serverUrl}/api/phase?id=${edited._id}`,
              payload,
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }

          return null;
        })
        .filter(Boolean);

      if (updateRequests.length === 0) {
        alert("No changes detected.");
        setIsPhasesSaving(false);
        return;
      }

      await Promise.all(updateRequests);

      setPhasesEditData((prev) =>
        prev.map((phase, idx) => ({
          ...phase,
          title: phasesEditData[idx].title,
          startDate: phasesEditData[idx].startDate,
          endDate: phasesEditData[idx].endDate,
        }))
      );

      if (project && project.timeline) {
        project.timeline = phasesEditData;
      }

      setIsPhasesEditOpen(false);
    } catch (err) {
      alert("Failed to update phases.");
    } finally {
      setIsPhasesSaving(false);
    }
  };

  const handlePhaseChange = (e) => {
    const { name, value } = e.target;
    const nextForm = {
      ...phaseForm,
      [name]: value,
    };

    setPhaseForm(nextForm);
    setPhaseFormMessage("");
    setPhaseFormErrors((prev) => ({
      ...prev,
      [name]: name === "title" ? validateRequiredText(value, "Phase title") : "",
      ...(name === "startDate"
        ? { startDate: validateNotPastDate(value, "Start date") }
        : {}),
      ...(name === "startDate" || name === "endDate"
        ? {
            dates:
              nextForm.startDate && nextForm.endDate
                ? validateDateOrder(nextForm.startDate, nextForm.endDate)
                : "",
          }
        : {}),
    }));
  };

  const handleAddPhase = async (e) => {
    e.preventDefault();

    if (userRole === "admin") {
      alert("Admins cannot create phases. Only designers can manage phases.");
      return;
    }

    const nextErrors = {
      title: validateRequiredText(phaseForm.title, "Phase title"),
      startDate: validateNotPastDate(phaseForm.startDate, "Start date"),
      dates: validateDateOrder(phaseForm.startDate, phaseForm.endDate),
    };

    setPhaseFormErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setPhaseFormMessage("Please fix the highlighted fields.");
      return;
    }

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
      setPhaseFormErrors({});
      setPhaseFormMessage("");
      location.reload();
    } catch (err) {
      setPhaseFormMessage("Failed to add phase.");
    }

    setIsSubmitting(false);
  };

  const handleAddPhaseClick = () => {
    if (userRole === "admin") {
      alert("Admins cannot create phases. Only designers can manage phases.");
      return;
    }
    setShowModal(true);
  };

  const isAdmin = userRole === "admin";
  const isDesigner = userRole === "designer";
  const completedTasks = tasks.filter(
    (task) => task.status?.toLowerCase() === "completed"
  ).length;
  const nextMilestone = phases.find((phase) => phase.endDate) || phases[0];
  const stats = [
    {
      label: "Phases",
      value: phases.length,
      helper: phases.length === 1 ? "Active phase plan" : "Structured delivery plan",
      icon: <FiLayers size={16} />,
    },
    {
      label: "Tasks",
      value: tasks.length,
      helper: `${completedTasks} completed`,
      icon: <FiFlag size={16} />,
    },
    {
      label: "Next milestone",
      value: nextMilestone ? formatDate(nextMilestone.endDate) : "Not scheduled",
      helper: nextMilestone?.title || "No phase timeline yet",
      icon: <FiCalendar size={16} />,
    },
  ];

  return (
    <div className="space-y-5">
      {showModal && isDesigner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[18px] border border-black/5 bg-[#fcfbf8] shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
            <div className="flex items-start justify-between border-b border-black/5 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Progress
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
                  Add phase
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Define the next milestone window for this project.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-black/5 px-3 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddPhase} className="space-y-5 px-6 py-6">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Phase title
                </span>
                <input
                  type="text"
                  name="title"
                  placeholder="Phase title"
                  className="mt-2 w-full rounded-xl border border-[#d8deda] bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#1d3c34] focus:ring-2 focus:ring-[#1d3c34]/10"
                  value={phaseForm.title}
                  onChange={handlePhaseChange}
                  required
                />
                {phaseFormErrors.title ? (
                  <p className="mt-2 text-sm text-red-600">{phaseFormErrors.title}</p>
                ) : null}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Start date
                  </span>
                  <input
                    type="date"
                    name="startDate"
                    className="mt-2 w-full rounded-xl border border-[#d8deda] bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#1d3c34] focus:ring-2 focus:ring-[#1d3c34]/10"
                    value={phaseForm.startDate}
                    onChange={handlePhaseChange}
                    required
                    min={new Date().toISOString().slice(0, 10)}
                  />
                  {phaseFormErrors.startDate ? (
                    <p className="mt-2 text-sm text-red-600">
                      {phaseFormErrors.startDate}
                    </p>
                  ) : null}
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    End date
                  </span>
                  <input
                    type="date"
                    name="endDate"
                    className="mt-2 w-full rounded-xl border border-[#d8deda] bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#1d3c34] focus:ring-2 focus:ring-[#1d3c34]/10"
                    value={phaseForm.endDate}
                    onChange={handlePhaseChange}
                    required
                    min={
                      phaseForm.startDate || new Date().toISOString().slice(0, 10)
                    }
                  />
                  {phaseFormErrors.dates ? (
                    <p className="mt-2 text-sm text-red-600">{phaseFormErrors.dates}</p>
                  ) : null}
                </label>
              </div>

              {phaseFormMessage ? (
                <p className="text-sm text-red-600">{phaseFormMessage}</p>
              ) : null}

              <div className="flex justify-end gap-3 border-t border-black/5 pt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-black/5 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#1D3C34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#163029]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Phase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="rounded-[18px] border border-black/5 bg-[#fcfbf8] p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.35)] sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Progress
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-900">
                Project progress
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-500">
                A simple view of the current delivery phases, schedule milestones,
                and task completion.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[16px] border border-[#e3ddd3] bg-white px-4 py-4"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <span className="text-[#1d3c34]">{item.icon}</span>
                    {item.label}
                  </div>
                  <p className="mt-3 text-lg font-semibold text-slate-900">
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{item.helper}</p>
                </div>
              ))}
            </div>
          </div>

          {overallProgress !== undefined && overallProgress !== null ? (
            <div className="flex min-w-[220px] flex-col items-center justify-center rounded-[16px] border border-[#e3ddd3] bg-white px-6 py-6">
              <RingProgressBar progress={overallProgress} />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Overall
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                Project completion
              </p>
            </div>
          ) : null}
        </div>

        {isDesigner ? (
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-black/5 pt-5">
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-[#c9d7d1] bg-white px-4 py-3 text-sm font-medium text-[#1d3c34] transition hover:border-[#1d3c34]/35"
              onClick={handleAddPhaseClick}
              type="button"
            >
              <FiPlus size={16} />
              Add Phase
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-[#1D3C34] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#163029]"
              onClick={openPhasesEditModal}
              type="button"
            >
              <FiEdit2 size={16} />
              Edit Phases
            </button>
          </div>
        ) : null}
      </section>

      {isAdmin && phases.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[#d8deda] bg-white px-6 py-10 text-center text-slate-500">
          <p className="text-base font-medium text-slate-700">No phases created yet</p>
          <p className="mt-2 text-sm text-slate-400">
            Only designers can create and manage phases.
          </p>
        </div>
      ) : null}

      {!isAdmin && phases.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[#d8deda] bg-white px-6 py-10 text-center text-slate-500">
          No phases yet.
        </div>
      ) : null}

      {phases.length > 0 ? (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {phases.map((phase, idx) => (
            <PhaseCard
              key={phase._id || idx}
              phase={phase}
              tasks={tasks}
              projectId={project._id}
              userRole={userRole}
            />
          ))}
        </div>
      ) : null}

      {isDesigner ? (
        <EditPhasesModal
          isOpen={isPhasesEditOpen}
          onClose={closePhasesEditModal}
          onSubmit={handlePhasesEditSubmit}
          isSaving={isPhasesSaving}
          phases={phasesEditData}
          onChangePhase={handleChangePhase}
          onRemovePhase={handleRemovePhaseEdit}
        />
      ) : null}
    </div>
  );
}

export default ProgressTab;
