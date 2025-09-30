import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useOutletContext } from "react-router-dom";
import PhaseCard from "./phases/PhaseCard";
import EditPhasesModal from "../../components/project/EditPhasesModal";

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
  // Edit phases modal state (only admin can edit, only date range editable)
  const [isPhasesEditOpen, setIsPhasesEditOpen] = useState(false);
  const [phasesEditData, setPhasesEditData] = useState([]);
  const [isPhasesSaving, setIsPhasesSaving] = useState(false);

  // Prepare modal data when opening (admin only)
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

  // Allow editing title and date range for designer
  const handleChangePhase = (idx, newPhase) => {
    setPhasesEditData((prev) =>
      prev.map((p, i) =>
        i === idx
          ? {
              ...p,
              ...newPhase,
            }
          : p
      )
    );
  };

  // Remove phase (admin only)
  const handleRemovePhaseEdit = (idx) => {
    setPhasesEditData((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit phase edits (designer only, now includes title)
  const handlePhasesEditSubmit = async (e) => {
    e.preventDefault();
    // Client-side validation: end date cannot be before start date
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
      // Only send requests for changed phases
      const updateRequests = phasesEditData
        .map((edited, idx) => {
          const original = phases[idx];
          let payload = {};
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
      // Update phases in UI locally
      setPhasesEditData((prev) =>
        prev.map((p, idx) => {
          const original = phases[idx];
          const edited = phasesEditData[idx];
          return {
            ...p,
            title: edited.title,
            startDate: edited.startDate,
            endDate: edited.endDate,
          };
        })
      );
      // Also update main phases array if needed
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
  const { project } = useOutletContext();
  const [showModal, setShowModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
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

  // Get user role from localStorage
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

  // For designer: handle phase form change, with validation
  const handlePhaseChange = (e) => {
    const { name, value } = e.target;
    setPhaseForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // For designer: add phase, with validation (disable past dates, end >= start)
  const handleAddPhase = async (e) => {
    e.preventDefault();

    // Prevent admin from creating phases
    if (userRole === "admin") {
      alert("Admins cannot create phases. Only designers can manage phases.");
      return;
    }

    // Validation: end date cannot be before start date
    if (phaseForm.endDate < phaseForm.startDate) {
      alert("End date cannot be before start date.");
      return;
    }
    // Validation: start date cannot be in the past
    const today = new Date().toISOString().slice(0, 10);
    if (phaseForm.startDate < today) {
      alert("Start date cannot be in the past.");
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
      location.reload();
    } catch (err) {
      alert("Failed to add phase.");
    }
    setIsSubmitting(false);
  };

  // Only designers can add phase
  const handleAddPhaseClick = () => {
    if (userRole === "admin") {
      alert("Admins cannot create phases. Only designers can manage phases.");
      return;
    }
    setShowModal(true);
  };

  const isAdmin = userRole === "admin";
  const isDesigner = userRole === "designer";

  return (
    <div className="space-y-8 bg-white rounded-xl shadow p-6">
      {/* Modal - Only show for designer */}
      {showModal && isDesigner && (
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
                  min={new Date().toISOString().slice(0, 10)}
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
                  min={
                    phaseForm.startDate || new Date().toISOString().slice(0, 10)
                  }
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

      {/* Add Phase button - Only show for designer */}
      {isDesigner && (
        <div className="flex justify-end mb-4 gap-2">
          <button
            className="bg-[#1D3C34] text-white px-4 py-2 rounded font-semibold hover:bg-[#16442A] transition cursor-pointer"
            onClick={handleAddPhaseClick}
          >
            Add Phase
          </button>
        </div>
      )}

      {/* Edit Phases button - Only show for designer */}
      {isDesigner && (
        <div className="flex justify-end mb-4 gap-2">
          <button
            className="bg-green-700 text-white px-4 py-2 rounded font-semibold hover:bg-green-800 transition cursor-pointer"
            onClick={openPhasesEditModal}
          >
            Edit Phases
          </button>
        </div>
      )}

      {/* Show admin message if admin and no phases */}
      {isAdmin && phases.length === 0 && (
        <div className="text-center text-gray-500 p-6 border border-dashed border-gray-300 rounded-lg">
          <p className="mb-1">No phases created yet</p>
          <p className="text-sm text-gray-400">
            Only designers can create and manage phases
          </p>
        </div>
      )}

      {overallProgress !== undefined && overallProgress !== null && (
        <div className="flex flex-col items-center">
          <RingProgressBar progress={overallProgress} />
          <div className=" font-semibold text-lg">Overall Project Progress</div>
        </div>
      )}

      {/* Show regular no phases message if not admin */}
      {!isAdmin && phases.length === 0 && (
        <div className="text-center text-gray-500">No phases yet.</div>
      )}

      {phases.map((phase, idx) => (
        <PhaseCard
          key={phase._id || idx}
          phase={phase}
          tasks={tasks}
          projectId={project._id}
          userRole={userRole}
        />
      ))}

      {/* Edit Phases Modal - Only for designer */}
      {isDesigner && (
        <EditPhasesModal
          isOpen={isPhasesEditOpen}
          onClose={closePhasesEditModal}
          onSubmit={handlePhasesEditSubmit}
          isSaving={isPhasesSaving}
          phases={phasesEditData}
          onChangePhase={handleChangePhase}
          onRemovePhase={handleRemovePhaseEdit}
        />
      )}
    </div>
  );
}

export default ProgressTab;
