import React, { useState, useEffect } from "react";
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
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
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
  const projectTypeOptions = [
    "Residential",
    "Commercial",
    "Hospitality",
    "Retail",
    "Healthcare",
    "Educational",
    "Institutional",
    "Event Spaces",
    "Renovation",
  ];
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

  // Get user role and ID from localStorage
  useEffect(() => {
    const role = localStorage.getItem("role");
    const id = localStorage.getItem("id");
    setUserRole(role);
    setUserId(id);
  }, []);

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

  const getStatusColor = (status) => {
    switch (status) {
      case "ongoing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      title: validateRequiredText(pendingProjectForm.title, "Project title", {
        minLength: 3,
        maxLength: 120,
      }),
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
          ? { designRecommendation: null }
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

  return (
    <>
      {/* Edit Project Modal - Only show for designers who can edit status */}
      {showEditModal && canEditStatus && (
        <div className="fixed inset-0 bg-black/30 h-full flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-lg w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-4 text-gray-500 text-2xl cursor-pointer"
              onClick={() => setShowEditModal(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Update Project Status</h2>
            <form onSubmit={handleEditProject} className="flex flex-col gap-4">
              <label className="">
                Status
                <select
                  name="status"
                  className="border rounded p-2 mt-1 w-full outline-black"
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
                className="bg-[#1D3C34] text-white rounded p-2 font-semibold hover:bg-[#16442A] transition cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Status"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showPendingEditModal && isAdmin && project.status === "pending" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <button
              className="absolute right-4 top-2 cursor-pointer text-2xl text-gray-500"
              onClick={() => setShowPendingEditModal(false)}
            >
              &times;
            </button>
            <h2 className="mb-4 text-xl font-bold">Edit Pending Project</h2>
            <form
              onSubmit={handlePendingProjectEdit}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <label className="block">
                Project Title
                <input
                  name="title"
                  type="text"
                  className="mt-1 w-full rounded border p-2"
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
                  className="mt-1 w-full rounded border p-2"
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
                  className="mt-1 w-full rounded border p-2"
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
                  className="mt-1 w-full rounded border p-2"
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
                  className="mt-1 w-full rounded border p-2"
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
                  className="mt-1 w-full rounded border bg-white p-2"
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
                  className="mt-1 w-full rounded border bg-white p-2"
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
                  className="mt-1 w-full rounded border bg-white p-2"
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
                  className="mt-1 w-full rounded border p-2"
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
                  className="mt-1 w-full rounded border p-2"
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
                  className="mt-1 w-full rounded border p-2"
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
                  className="rounded border px-4 py-2 text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowPendingEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-[#1D3C34] px-4 py-2 font-semibold text-white hover:bg-[#16442A] transition"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Details Modal for Adding Designers */}
      {showDetailsModal && (
        <ProjectDetailsModal
          project={project}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      <div className="bg-white border rounded-xl p-4 shadow-md flex flex-col justify-between h-full">
        <div className="flex items-start justify-between border-b pb-2 mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
              {project.title}
              {/* Only show edit icon for non-pending projects and designers who can edit status */}
              {canEditStatus && project.status !== "pending" && (
                <FiEdit2
                  className="text-gray-400 text-sm cursor-pointer hover:text-gray-600"
                  onClick={() => setShowEditModal(true)}
                  title="Update Status"
                />
              )}
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                  project.status
                )}`}
              >
                {project.status?.charAt(0).toUpperCase() +
                  project.status?.slice(1)}
              </span>
              {project.roomType && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {project.roomType}
                </span>
              )}
              {/* Show member badge for designers */}
              {isDesigner && isProjectMember && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  Member
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 ml-2">
            {!restoreMode && isAdmin && project.status === "pending" && (
              <button
                className="flex items-center gap-1 rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-200"
                onClick={() => {
                  setPendingProjectForm(getPendingProjectForm(project));
                  setPendingProjectErrors({});
                  setShowPendingEditModal(true);
                }}
              >
                <FaEdit size={12} />
                Edit
              </button>
            )}
            {/* Only show view button if not restoreMode */}
            {!restoreMode && (
              <button
                className="bg-[#1D3C34] text-white text-sm px-3 py-1 rounded hover:bg-[#145c4b] transition"
                onClick={() => onView && onView(project._id)}
              >
                View
              </button>
            )}
            {/* Restore button for recycle bin */}
            {restoreMode && (
              <button
                className="bg-green-600 text-white text-sm px-2 py-1 rounded hover:bg-green-700 transition flex items-center"
                onClick={() => onDelete && onDelete(project._id)}
                title="Restore Project"
              >
                Restore
              </button>
            )}
            {/* Add Designer button - Only show if admin and can add designer and not restoreMode */}
            {!restoreMode && canAddDesigner && (
              <button
                className="bg-blue-600 text-white text-sm px-2 py-1 rounded hover:bg-blue-700 transition flex items-center"
                onClick={handleAddDesigner}
                title="Add Designer"
              >
                <FaUserPlus size={12} />
              </button>
            )}
            {/* Only show delete button if admin and not restoreMode */}
            {!restoreMode && isAdmin && (
              <button
                className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded hover:bg-red-500 hover:text-white flex items-center"
                onClick={() => onDelete && onDelete(project._id)}
                title="Delete Project"
              >
                <FaTrash size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 mb-3">
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {project.description}
          </p>

          <div className="space-y-2 text-sm">
            {project.budget && (
              <div className="flex items-center gap-2 text-green-600">
                <span className="font-medium">
                  {formatBudget(project.budget)}
                </span>
              </div>
            )}

            {project.projectLocation && (
              <div className="flex items-center gap-2 text-gray-600">
                <FaMapMarkerAlt size={12} />
                <span className="text-xs truncate">
                  {project.projectLocation}
                </span>
              </div>
            )}

            {project.projectSize && (
              <div className="flex items-center gap-2 text-gray-600">
                <FaRulerCombined size={12} />
                <span className="text-xs">{project.projectSize} sq ft</span>
              </div>
            )}
          </div>
        </div>

        {(formattedStartDate || formattedEndDate) && (
          <div className="border-t pt-2 mb-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              {formattedStartDate && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Start:</span>
                  <span>{formattedStartDate}</span>
                </div>
              )}
              {formattedEndDate && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">End:</span>
                  <span className="text-red-500 font-medium">
                    {formattedEndDate}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-2">
          <div className="flex items-center gap-1">
            <FaUsers size={12} />
            <span className="text-xs">
              {project.members?.length || 0} members
            </span>
          </div>
          {project.progress !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Progress:</span>
              <div className="w-12 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#1D3C34] h-2 rounded-full"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium">{project.progress}%</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectCard;
