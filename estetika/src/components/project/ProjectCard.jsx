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

const ProjectCard = ({ project, onView, onDelete, restoreMode }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [editProjectForm, setEditProjectForm] = useState({
    status: project.status || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  // Get user role and ID from localStorage
  useEffect(() => {
    const role = localStorage.getItem("role");
    const id = localStorage.getItem("id");
    setUserRole(role);
    setUserId(id);
  }, []);

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
              {/* Only show edit icon for designers who can edit status */}
              {canEditStatus && (
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
