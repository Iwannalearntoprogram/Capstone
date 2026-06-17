import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FaEdit,
  FaUsers,
  FaRegCalendarAlt,
  FaTrash,
  FaMapMarkerAlt,
  FaRulerCombined,
  FaUserPlus,
} from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import axios from "axios";
import Cookies from "js-cookie";
import ProjectDetailsModal from "./ProjectDetailsModal";
import {
  trimValue,
  validateDateOrder,
  validatePositiveNumber,
  validateProjectTitle,
  validateRequiredText,
  validateUrl,
} from "../../utils/validation";

const ProjectCard = ({
  project,
  onView,
  onDelete,
  restoreMode,
  onProjectUpdated,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPendingEditModal, setShowPendingEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editProjectForm, setEditProjectForm] = useState({
    status: project.status || "",
  });
  const roomTypeOptions = [
    "Living Room",
    "Bedroom",
    "Kitchen",
    "Bathroom",
    "Home Office",
    "Dining Room",
    "Whole House",
    "Commercial Space",
  ];
  const projectTypeOptions = ["Residential", "Commercial", "Renovation"];
  const priorityOptions = ["Budget", "Style"];
  const formatDateInputValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };
  const getPendingProjectForm = (currentProject) => ({
    title: currentProject.title || "",
    description: currentProject.description || "",
    budget: currentProject.budget ?? "",
    startDate: formatDateInputValue(currentProject.startDate),
    endDate: formatDateInputValue(currentProject.endDate),
    roomType: currentProject.roomType || "",
    projectType: currentProject.projectType || "",
    priority: currentProject.priority || "",
    projectSize: currentProject.projectSize ?? "",
    projectLocation: currentProject.projectLocation || "",
    designInspiration: currentProject.designInspiration || "",
  });
  const [pendingProjectForm, setPendingProjectForm] = useState(
    getPendingProjectForm(project)
  );
  const [pendingProjectErrors, setPendingProjectErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const userRole = localStorage.getItem("role");
  const userId = localStorage.getItem("id");

  useEffect(() => {
    setEditProjectForm({ status: project.status || "" });
    setPendingProjectForm(getPendingProjectForm(project));
    setPendingProjectErrors({});
  }, [project]);

  let formattedEndDate = "";
  if (project.endDate) {
    const date = new Date(project.endDate);
    formattedEndDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  let formattedStartDate = "";
  if (project.startDate) {
    const date = new Date(project.startDate);
    formattedStartDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const formatBudget = (budget) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(budget);
  };

  const getStatusMeta = (status) => {
    switch (status) {
      case "ongoing":
        return {
          label: "Ongoing",
          badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
          accent: "from-emerald-500 to-teal-400",
          progressBar: "bg-emerald-600",
        };
      case "delayed":
        return {
          label: "Delayed",
          badge: "bg-rose-50 text-rose-700 ring-rose-100",
          accent: "from-rose-500 to-orange-300",
          progressBar: "bg-emerald-600",
        };
      case "completed":
        return {
          label: "Completed",
          badge: "bg-slate-100 text-slate-700 ring-slate-200",
          accent: "from-slate-800 to-slate-500",
          progressBar: "bg-slate-700",
        };
      case "pending":
        return {
          label: "Pending",
          badge: "bg-amber-50 text-amber-700 ring-amber-100",
          accent: "from-amber-400 to-yellow-300",
          progressBar: "bg-amber-500",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          badge: "bg-stone-100 text-stone-600 ring-stone-200",
          accent: "from-stone-400 to-stone-300",
          progressBar: "bg-stone-400",
        };
      default:
        return {
          label: "Unknown",
          badge: "bg-gray-100 text-gray-700 ring-gray-200",
          accent: "from-gray-400 to-gray-300",
          progressBar: "bg-gray-500",
        };
    }
  };

  const handleEditProjectChange = (e) => {
    const { name, value } = e.target;
    setEditProjectForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = Cookies.get("token");

      // Only send status update for designers
      const updatedProject = {
        status: editProjectForm.status,
      };

      await axios.put(
        `${serverUrl}/api/project?id=${project._id}`,
        updatedProject,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShowEditModal(false);
      alert("Project status updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to update project status.");
    }
    setIsSubmitting(false);
  };

  const handlePendingProjectChange = (e) => {
    const { name, value } = e.target;
    setPendingProjectForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPendingProjectErrors((prev) => ({
      ...prev,
      [name]: "",
      dates:
        name === "startDate" || name === "endDate"
          ? ""
          : prev.dates,
    }));
  };

  const handlePendingProjectEdit = async (e) => {
    e.preventDefault();

    const nextErrors = {
      title: validateProjectTitle(pendingProjectForm.title),
      description: validateRequiredText(
        pendingProjectForm.description,
        "Description",
        { minLength: 10, maxLength: 2000 }
      ),
      budget: validatePositiveNumber(pendingProjectForm.budget, "Budget"),
      dates: validateDateOrder(
        pendingProjectForm.startDate,
        pendingProjectForm.endDate
      ),
      roomType: validateRequiredText(pendingProjectForm.roomType, "Room type"),
      projectType: validateRequiredText(
        pendingProjectForm.projectType,
        "Project type"
      ),
      priority: validateRequiredText(pendingProjectForm.priority, "Priority"),
      projectSize: validatePositiveNumber(
        pendingProjectForm.projectSize,
        "Project size"
      ),
      projectLocation: validateRequiredText(
        pendingProjectForm.projectLocation,
        "Project location",
        { minLength: 2, maxLength: 120 }
      ),
      designInspiration: validateUrl(
        pendingProjectForm.designInspiration,
        "Design inspiration link"
      ),
    };

    setPendingProjectErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const token = Cookies.get("token");
      const recommendationCriteriaChanged =
        trimValue(project.description) !==
          trimValue(pendingProjectForm.description) ||
        Number(project.budget ?? 0) !== Number(pendingProjectForm.budget) ||
        (project.roomType || "") !== pendingProjectForm.roomType ||
        (project.priority || "") !== pendingProjectForm.priority;
      const payload = {
        title: trimValue(pendingProjectForm.title),
        description: trimValue(pendingProjectForm.description),
        budget: Number(pendingProjectForm.budget),
        startDate: pendingProjectForm.startDate,
        endDate: pendingProjectForm.endDate,
        roomType: pendingProjectForm.roomType,
        projectType: pendingProjectForm.projectType,
        priority: pendingProjectForm.priority,
        projectSize: Number(pendingProjectForm.projectSize),
        projectLocation: trimValue(pendingProjectForm.projectLocation),
        designInspiration:
          trimValue(pendingProjectForm.designInspiration) || undefined,
        ...(recommendationCriteriaChanged
          ? { designRecommendation: null, designRecommendations: [] }
          : {}),
      };

      const response = await axios.put(
        `${serverUrl}/api/project?id=${project._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShowPendingEditModal(false);
      setPendingProjectErrors({});
      onProjectUpdated?.(response.data.updatedProject);
      alert("Pending project updated successfully.");
    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message || "Failed to update pending project."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = userRole === "admin";
  const isDesigner = userRole === "designer";

  const isProjectMember = project.members?.includes(userId);

  const canAddDesigner =
    isAdmin && project.status !== "pending" && project.status !== "cancelled";

  const canEditStatus = isAdmin;

  const handleAddDesigner = () => {
    setShowDetailsModal(true);
  };

  // Get available status options for designers
  const getStatusOptions = () => {
    return [
      { value: "pending", label: "Pending" },
      { value: "ongoing", label: "Ongoing" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ];
  };

  const statusOptions = getStatusOptions();
  const statusMeta = getStatusMeta(project.status);
  const progressValue = Number.isFinite(Number(project.progress))
    ? Math.min(Math.max(Number(project.progress), 0), 100)
    : 0;
  const formattedProgressValue = progressValue.toFixed(2);
  const memberCount = Array.isArray(project.members) ? project.members.length : 0;
  const timelineLabel =
    formattedStartDate || formattedEndDate
      ? `${formattedStartDate || "TBD"} - ${formattedEndDate || "TBD"}`
      : "Timeline to be confirmed";
  const renderModal = (modalContent) =>
    typeof document !== "undefined"
      ? createPortal(modalContent, document.body)
      : null;

  return (
    <>
      {/* Edit Project Modal - Only show for designers who can edit status */}
      {showEditModal && canEditStatus && (
        renderModal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
            <div className="relative w-full max-w-md rounded-[14px] border border-stone-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
              <button
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-[10px] border border-stone-200 text-xl text-gray-400 transition hover:border-stone-300 hover:text-gray-600"
                onClick={() => setShowEditModal(false)}
              >
                &times;
              </button>
              <h2 className="pr-8 text-xl font-bold text-slate-900">
                Update Project Status
              </h2>
              <form onSubmit={handleEditProject} className="mt-5 flex flex-col gap-4">
                <label className="text-sm font-medium text-slate-700">
                  <span className="block">Status</span>
                  <select
                    name="status"
                    className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 outline-black"
                    value={editProjectForm.status}
                    onChange={handleEditProjectChange}
                    required
                  >
                    <option value="">Select Status</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  className="rounded-md bg-[#1D3C34] px-4 py-2.5 font-semibold text-white transition hover:bg-[#16442A] disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Status"}
                </button>
              </form>
            </div>
          </div>
        )
      )}

      {showPendingEditModal && isAdmin && project.status === "pending" && (
        renderModal(
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/45 p-4 backdrop-blur-[2px]">
            <div className="flex min-h-full items-start justify-center py-6 sm:items-center">
              <div className="relative w-full max-w-5xl rounded-[14px] border border-stone-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.2)] sm:p-6">
                <button
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-[10px] border border-stone-200 text-xl text-gray-400 transition hover:border-stone-300 hover:text-gray-600"
                  onClick={() => setShowPendingEditModal(false)}
                >
                  &times;
                </button>
                <h2 className="pr-8 text-xl font-bold text-slate-900">
                  Edit Pending Project
                </h2>
                <form
                  onSubmit={handlePendingProjectEdit}
                  className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
                >
              <label className="block">
                Project Title
                <input
                  name="title"
                  type="text"
                  className="mt-1 w-full rounded-md border p-2"
                  value={pendingProjectForm.title}
                  onChange={handlePendingProjectChange}
                  maxLength={120}
                  required
                />
                {pendingProjectErrors.title && (
                  <p className="mt-1 text-sm text-red-500">
                    {pendingProjectErrors.title}
                  </p>
                )}
              </label>

              <label className="block">
                Estimated Budget
                <input
                  name="budget"
                  type="number"
                  className="mt-1 w-full rounded-md border p-2"
                  value={pendingProjectForm.budget}
                  onChange={handlePendingProjectChange}
                  min="0.01"
                  step="0.01"
                  required
                />
                {pendingProjectErrors.budget && (
                  <p className="mt-1 text-sm text-red-500">
                    {pendingProjectErrors.budget}
                  </p>
                )}
              </label>

              <label className="block md:col-span-2">
                Description
                <textarea
                  name="description"
                  className="mt-1 w-full rounded-md border p-2"
                  rows={4}
                  value={pendingProjectForm.description}
                  onChange={handlePendingProjectChange}
                  maxLength={2000}
                  required
                />
                {pendingProjectErrors.description && (
                  <p className="mt-1 text-sm text-red-500">
                    {pendingProjectErrors.description}
                  </p>
                )}
              </label>

              <label className="block">
                Start Date
                <input
                  name="startDate"
                  type="date"
                  className="mt-1 w-full rounded-md border p-2"
                  value={pendingProjectForm.startDate}
                  onChange={handlePendingProjectChange}
                  required
                />
              </label>

              <label className="block">
                End Date
                <input
                  name="endDate"
                  type="date"
                  className="mt-1 w-full rounded-md border p-2"
                  value={pendingProjectForm.endDate}
                  onChange={handlePendingProjectChange}
                  required
                />
              </label>

              {pendingProjectErrors.dates && (
                <p className="-mt-2 text-sm text-red-500 md:col-span-2">
                  {pendingProjectErrors.dates}
                </p>
              )}

              <label className="block">
                Room Type
                <select
                  name="roomType"
                  className="mt-1 w-full rounded-md border bg-white p-2"
                  value={pendingProjectForm.roomType}
                  onChange={handlePendingProjectChange}
                  required
                >
                  <option value="">Select room type</option>
                  {roomTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {pendingProjectErrors.roomType && (
                  <p className="mt-1 text-sm text-red-500">
                    {pendingProjectErrors.roomType}
                  </p>
                )}
              </label>

              <label className="block">
                Project Type
                <select
                  name="projectType"
                  className="mt-1 w-full rounded-md border bg-white p-2"
                  value={pendingProjectForm.projectType}
                  onChange={handlePendingProjectChange}
                  required
                >
                  <option value="">Select project type</option>
                  {projectTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {pendingProjectErrors.projectType && (
                  <p className="mt-1 text-sm text-red-500">
                    {pendingProjectErrors.projectType}
                  </p>
                )}
              </label>

              <label className="block">
                Priority
                <select
                  name="priority"
                  className="mt-1 w-full rounded-md border bg-white p-2"
                  value={pendingProjectForm.priority}
                  onChange={handlePendingProjectChange}
                  required
                >
                  <option value="">Select priority</option>
                  {priorityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {pendingProjectErrors.priority && (
                  <p className="mt-1 text-sm text-red-500">
                    {pendingProjectErrors.priority}
                  </p>
                )}
              </label>

              <label className="block">
                Project Size (sq ft)
                <input
                  name="projectSize"
                  type="number"
                  className="mt-1 w-full rounded-md border p-2"
                  value={pendingProjectForm.projectSize}
                  onChange={handlePendingProjectChange}
                  min="0.01"
                  step="0.01"
                  required
                />
                {pendingProjectErrors.projectSize && (
                  <p className="mt-1 text-sm text-red-500">
                    {pendingProjectErrors.projectSize}
                  </p>
                )}
              </label>

              <label className="block md:col-span-2">
                Project Location
                <input
                  name="projectLocation"
                  type="text"
                  className="mt-1 w-full rounded-md border p-2"
                  value={pendingProjectForm.projectLocation}
                  onChange={handlePendingProjectChange}
                  maxLength={120}
                  required
                />
                {pendingProjectErrors.projectLocation && (
                  <p className="mt-1 text-sm text-red-500">
                    {pendingProjectErrors.projectLocation}
                  </p>
                )}
              </label>

              <label className="block md:col-span-2">
                Design Inspiration Link
                <input
                  name="designInspiration"
                  type="url"
                  className="mt-1 w-full rounded-md border p-2"
                  value={pendingProjectForm.designInspiration}
                  onChange={handlePendingProjectChange}
                  placeholder="https://..."
                />
                {pendingProjectErrors.designInspiration && (
                  <p className="mt-1 text-sm text-red-500">
                    {pendingProjectErrors.designInspiration}
                  </p>
                )}
              </label>

              <div className="flex justify-end gap-2 md:col-span-2">
                <button
                  type="button"
                  className="rounded-md border px-4 py-2 text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowPendingEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#1D3C34] px-4 py-2 font-semibold text-white hover:bg-[#16442A] transition"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
                </form>
              </div>
            </div>
          </div>
        )
      )}

      {/* Project Details Modal for Adding Designers */}
      {showDetailsModal && (
        renderModal(
          <ProjectDetailsModal
            project={project}
            onClose={() => setShowDetailsModal(false)}
          />
        )
      )}

      <div className="group flex h-full flex-col rounded-[12px] border border-stone-200/80 bg-white p-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(15,23,42,0.1)]">
        <div
          className={`h-1 w-12 rounded-sm bg-gradient-to-r ${statusMeta.accent}`}
        />

        <div className="mt-3 flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${statusMeta.badge}`}
              >
                {statusMeta.label}
              </span>
              {project.roomType && (
                <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                  {project.roomType}
                </span>
              )}
              {project.projectType && (
                <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                  {project.projectType}
                </span>
              )}
              {project.priority && (
                <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700">
                  {project.priority}
                </span>
              )}
              {isDesigner && isProjectMember && (
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                  Member
                </span>
              )}
            </div>

            <h3 className="mt-2.5 break-words text-base font-semibold tracking-tight text-slate-900">
              {project.title || "Untitled project"}
            </h3>
            <p className="mt-1 line-clamp-3 text-[13px] leading-5 text-slate-600">
              {project.description ||
                "Project details will appear here once the brief is finalized."}
            </p>
          </div>

          {!restoreMode && (
            <div className="flex shrink-0 items-center gap-1.5">
              {isAdmin && project.status === "pending" && (
                <button
                  className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[10px] font-medium text-slate-600 transition hover:border-stone-300 hover:bg-stone-50"
                  onClick={() => {
                    setPendingProjectForm(getPendingProjectForm(project));
                    setPendingProjectErrors({});
                    setShowPendingEditModal(true);
                  }}
                >
                  <FaEdit size={10} />
                  Edit
                </button>
              )}
              {canEditStatus && project.status !== "pending" && (
                <button
                  className="flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-stone-200 bg-white text-slate-500 transition hover:border-stone-300 hover:bg-stone-50 hover:text-slate-700"
                  onClick={() => setShowEditModal(true)}
                  title="Update Status"
                >
                  <FiEdit2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Budget
          </p>
          <p className="mt-1 truncate text-[1.65rem] font-semibold tracking-tight text-emerald-700">
            {project.budget ? formatBudget(project.budget) : "Not set"}
          </p>

          <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
            <div className="rounded-[10px] bg-stone-50 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-400">
                <FaMapMarkerAlt size={10} />
                Location
              </div>
              <p className="mt-1 text-[13px] text-slate-600">
                {project.projectLocation || "To be confirmed"}
              </p>
            </div>

            <div className="rounded-[10px] bg-stone-50 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-400">
                <FaRulerCombined size={10} />
                Size
              </div>
              <p className="mt-1 text-[13px] text-slate-600">
                {project.projectSize ? `${project.projectSize} sq ft` : "Not set"}
              </p>
            </div>

            <div className="rounded-[10px] bg-stone-50 px-3 py-2.5 sm:col-span-2">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-400">
                <FaRegCalendarAlt size={10} />
                Timeline
              </div>
              <p className="mt-1 text-[13px] text-slate-600">{timelineLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <div className="rounded-[10px] border border-stone-200/80 bg-stone-50/90 px-3 py-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>Progress</span>
              <span className="text-slate-700">{formattedProgressValue}%</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-md bg-stone-200">
              <div
                className={`h-full rounded-md ${statusMeta.progressBar}`}
                style={{ width: `${progressValue}%` }}
              ></div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <FaUsers size={10} className="text-stone-400" />
                {memberCount} member{memberCount === 1 ? "" : "s"}
              </span>
              <span>{formattedEndDate ? `Due ${formattedEndDate}` : "No due date"}</span>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            {!restoreMode ? (
              <button
                className="flex-1 rounded-lg bg-[#1D3C34] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#173129]"
                onClick={() => onView && onView(project._id)}
              >
                View Project
              </button>
            ) : (
              <button
                className="flex-1 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
                onClick={() => onDelete && onDelete(project._id)}
                title="Restore Project"
              >
                Restore Project
              </button>
            )}

            {!restoreMode && canAddDesigner && (
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-slate-600 transition hover:border-stone-300 hover:bg-stone-50"
                onClick={handleAddDesigner}
                title="Add Designer"
              >
                <FaUserPlus size={12} />
              </button>
            )}

            {!restoreMode && isAdmin && (
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                onClick={() => onDelete && onDelete(project._id)}
                title="Delete Project"
              >
                <FaTrash size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectCard;
