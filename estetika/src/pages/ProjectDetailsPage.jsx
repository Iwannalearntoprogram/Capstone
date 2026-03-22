import { useParams, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

import ReactModal from "react-modal";
import EditProjectModal from "../components/project/EditProjectModal";
import {
  trimValue,
  validateDateOrder,
  validatePositiveNumber,
  validateRequiredText,
} from "../utils/validation";

function ProjectDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const [project, setProject] = useState(location.state?.project || null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    budget: "",
    startDate: "",
    endDate: "",
  });
  const [editErrors, setEditErrors] = useState({});
  const [editMessage, setEditMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Prepare modal data when opening
  const openEditModal = () => {
    if (project) {
      setEditData({
        title: project.title || "",
        description: project.description || "",
        budget: project.budget || "",
        startDate: project.startDate ? project.startDate.slice(0, 10) : "",
        endDate: project.endDate ? project.endDate.slice(0, 10) : "",
      });
      setEditErrors({});
      setEditMessage("");
      setIsEditOpen(true);
    }
  };

  const closeEditModal = () => setIsEditOpen(false);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
    setEditMessage("");
    setEditErrors((prev) => ({
      ...prev,
      [name]:
        name === "title"
          ? validateRequiredText(value, "Title")
          : name === "description"
          ? validateRequiredText(value, "Description")
          : name === "budget"
          ? validatePositiveNumber(value, "Budget")
          : "",
      ...(name === "startDate" || name === "endDate"
        ? {
            dates: validateDateOrder(
              name === "startDate" ? value : editData.startDate,
              name === "endDate" ? value : editData.endDate
            ),
          }
        : {}),
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {
      title: validateRequiredText(editData.title, "Title"),
      description: validateRequiredText(editData.description, "Description"),
      budget: validatePositiveNumber(editData.budget, "Budget"),
      dates: validateDateOrder(editData.startDate, editData.endDate),
    };
    setEditErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setEditMessage("Please fix the highlighted fields.");
      return;
    }
    setIsSaving(true);
    try {
      const token = Cookies.get("token");
      await axios.put(
        `${serverUrl}/api/project?id=${id}`,
        {
          title: trimValue(editData.title),
          description: trimValue(editData.description),
          budget: editData.budget,
          startDate: editData.startDate,
          endDate: editData.endDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      closeEditModal();
      fetchProject();
    } catch (err) {
      setEditMessage("Failed to update project.");
    } finally {
      setIsSaving(false);
    }
  };

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  const fetchProject = async () => {
    try {
      const token = Cookies.get("token");
      const response = await axios.get(`${serverUrl}/api/project?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProject(
        Array.isArray(response.data.project)
          ? response.data.project[0]
          : response.data.project
      );
    } catch {
      // handle error
    }
  };

  useEffect(() => {
    // If project is not passed via state, fetch it by id
    if (!project && id) {
      fetchProject();
    }
  }, [id, project]);

  const tabs = [
    { label: "Overview", path: "overview" },
    { label: "Tasks", path: "tasks" },
    { label: "Progress", path: "progress" },
    { label: "Timeline", path: "timeline" },
    { label: "Files", path: "files" },
    { label: "Updates", path: "update" },
    { label: "Materials", path: "material" },
  ];

  return (
    <div className="mx-auto px-0 py-4 sm:px-2 sm:py-6">
      {/* Project Header */}
      <div className="mb-8">
        <h1 className="text-2xl text-center font-bold mb-2 sm:text-3xl">
          {project?.title || "Project Not Found"}
        </h1>
        {/* Edit Button (hidden if status is pending) */}
        {project && project.status !== "pending" && (
          <div className="flex justify-center mt-4">
            <button
              className="bg-[#1d3c34] text-white px-4 py-2 rounded hover:bg-[#145026] transition-colors duration-200"
              onClick={openEditModal}
            >
              Edit Project
            </button>
          </div>
        )}
        {/* Edit Modal */}
        <EditProjectModal
          isOpen={isEditOpen}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
          isSaving={isSaving}
          editData={editData}
          onChange={handleEditChange}
          errors={editErrors}
          message={editMessage}
        />
      </div>

      {/* Tabs */}
      <div className="mb-8 overflow-x-auto">
        <nav className="mx-auto flex min-w-max justify-center gap-4 border-b border-black/5 pb-1 sm:gap-6">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={`/dashboard/projects/${id}/${tab.path}`}
              className={({ isActive }) =>
                `whitespace-nowrap py-2 px-1 border-b-2 transition-colors duration-200 ${
                  isActive
                    ? "border-[#1d3c34] text-[#1d3c34] font-semibold"
                    : "border-transparent text-gray-500 hover:text-[#1d3c34]"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px] rounded-xl px-0 sm:px-2 lg:px-8">
        <Outlet context={{ project, refreshProject: fetchProject }} />
      </div>
    </div>
  );
}

export default ProjectDetailsPage;
