import React, { useState, useEffect } from "react";
import {
  FaEdit,
  FaUsers,
  FaRegCalendarAlt,
  FaTrash,
  FaMapMarkerAlt,
  FaDollarSign,
  FaRulerCombined,
} from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import axios from "axios";
import Cookies from "js-cookie";

const ProjectCard = ({ project, onView, onDelete }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [editProjectForm, setEditProjectForm] = useState({
    title: project.title || "",
    description: project.description || "",
    budget: project.budget || "",
    startDate: project.startDate ? project.startDate.split("T")[0] : "",
    endDate: project.endDate ? project.endDate.split("T")[0] : "",
    projectLocation: project.projectLocation || "",
    projectSize: project.projectSize || "",
    roomType: project.roomType || "",
    status: project.status || "",
    members: project.members || [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  // Get user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
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
      currency: "USD",
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
      const updatedProject = {
        title: editProjectForm.title,
        description: editProjectForm.description,
        budget: Number(editProjectForm.budget),
        startDate: new Date(editProjectForm.startDate).toISOString(),
        endDate: new Date(editProjectForm.endDate).toISOString(),
        projectLocation: editProjectForm.projectLocation,
        projectSize: editProjectForm.projectSize
          ? Number(editProjectForm.projectSize)
          : null,
        roomType: editProjectForm.roomType,
        status: editProjectForm.status,
        members: Array.isArray(editProjectForm.members)
          ? editProjectForm.members.map((member) =>
              typeof member === "object" && member !== null && member._id
                ? member._id
                : member
            )
          : [],
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
      alert("Project updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to update project.");
    }
    setIsSubmitting(false);
  };

  const isAdmin = userRole === "admin";

  const addMemberField = () => {
    setEditProjectForm((prev) => ({
      ...prev,
      members: [...editProjectForm.members, ""],
    }));
  };

  return (
    <>
      {/* Edit Project Modal - Only show if admin */}
      {showEditModal && isAdmin && (
        <div className="fixed inset-0 bg-black/30 h-full flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-lg w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-4 text-gray-500 text-2xl cursor-pointer"
              onClick={() => setShowEditModal(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Project</h2>
            <form onSubmit={handleEditProject} className="flex flex-col gap-4">
              <label className="">
                Project Title
                <input
                  type="text"
                  name="title"
                  placeholder="Project Title"
                  className="border rounded p-2 mt-1 w-full outline-black"
                  value={editProjectForm.title}
                  onChange={handleEditProjectChange}
                  required
                />
              </label>
              <label className="">
                Description
                <textarea
                  name="description"
                  placeholder="Description"
                  className="border rounded p-2 mt-1 w-full outline-black"
                  value={editProjectForm.description}
                  onChange={handleEditProjectChange}
                  required
                />
              </label>
              <label className="">
                Budget
                <input
                  type="number"
                  name="budget"
                  placeholder="Budget"
                  className="border rounded p-2 mt-1 w-full outline-black"
                  value={editProjectForm.budget}
                  onChange={handleEditProjectChange}
                  required
                />
              </label>
              <label className="">
                Start Date
                <input
                  type="date"
                  name="startDate"
                  className="border rounded p-2 mt-1 w-full outline-black"
                  value={editProjectForm.startDate}
                  onChange={handleEditProjectChange}
                  required
                />
              </label>
              <label className="">
                End Date
                <input
                  type="date"
                  name="endDate"
                  className="border rounded p-2 mt-1 w-full outline-black"
                  value={editProjectForm.endDate}
                  onChange={handleEditProjectChange}
                  required
                />
              </label>
              <label className="">
                Project Location
                <input
                  type="text"
                  name="projectLocation"
                  placeholder="Project Location"
                  className="border rounded p-2 mt-1 w-full outline-black"
                  value={editProjectForm.projectLocation}
                  onChange={handleEditProjectChange}
                />
              </label>
              <label className="">
                Project Size (sq ft)
                <input
                  type="number"
                  name="projectSize"
                  placeholder="Project Size"
                  className="border rounded p-2 mt-1 w-full outline-black"
                  value={editProjectForm.projectSize}
                  onChange={handleEditProjectChange}
                />
              </label>
              <label className="">
                Room Type
                <input
                  type="text"
                  name="roomType"
                  placeholder="Room Type"
                  className="border rounded p-2 mt-1 w-full outline-black"
                  value={editProjectForm.roomType}
                  onChange={handleEditProjectChange}
                />
              </label>
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
                  <option value="pending">Pending</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Members
                </label>
                <ul className="mb-2">
                  {editProjectForm.members &&
                  editProjectForm.members.length > 0 ? (
                    editProjectForm.members.map((member, index) => (
                      <li
                        key={member._id || index}
                        className="flex items-center justify-between mb-1"
                      >
                        <input
                          key={index}
                          type="text"
                          placeholder={`Member ${index + 1} Email or Username`}
                          value={member.fullName}
                          onChange={(e) => {
                            const updatedMembers = [...editProjectForm.members];
                            updatedMembers[index] = `${e.target.value}`;
                            setEditProjectForm((prev) => ({
                              ...prev,
                              members: updatedMembers,
                            }));
                          }}
                          className="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                        />
                        <button
                          type="button"
                          className="text-red-500 text-xs px-2 py-1 rounded hover:bg-red-100"
                          onClick={async () => {
                            try {
                              const token = Cookies.get("token");
                              await axios.put(
                                `${serverUrl}/api/project/remove-member?id=${project._id}`,
                                { memberId: member._id },
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                }
                              );
                              alert("Member removed!");
                              window.location.reload();
                            } catch (err) {
                              alert("Failed to remove member.");
                            }
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400 text-xs">No members yet.</li>
                  )}
                  <li>
                    <button
                      type="button"
                      onClick={addMemberField}
                      className="text-[#1D3C34] text-sm hover:underline"
                    >
                      + Add Member
                    </button>
                  </li>
                </ul>
              </div>
              <button
                type="submit"
                className="bg-[#1D3C34] text-white rounded p-2 font-semibold hover:bg-[#16442A] transition cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Project"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-xl p-4 shadow-md flex flex-col justify-between h-full">
        <div className="flex items-start justify-between border-b pb-2 mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
              {project.title}
              {/* Only show edit icon if NOT admin */}
              {!isAdmin && (
                <FiEdit2
                  className="text-gray-400 text-sm cursor-pointer hover:text-gray-600"
                  onClick={() => setShowEditModal(true)}
                  title="Edit Project"
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
            </div>
          </div>
          <div className="flex gap-2 ml-2">
            <button
              className="bg-[#1D3C34] text-white text-sm px-3 py-1 rounded hover:bg-[#145c4b] transition"
              onClick={() => onView(project._id)}
            >
              View
            </button>
            {/* Only show delete button if admin */}
            {isAdmin && (
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
                <FaDollarSign size={12} />
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
