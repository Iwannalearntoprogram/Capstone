import { useParams, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { FiArrowLeft } from "react-icons/fi";

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
  const navigate = useNavigate();
  const [project, setProject] = useState(location.state?.project || null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    budget: "",
    priority: "",
    designPreference: "",
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
        priority: project.priority || "",
        designPreference: project.designPreference || "",
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
          : name === "priority"
          ? validateRequiredText(value, "Priority")
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
      priority: validateRequiredText(editData.priority, "Priority"),
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
          priority: trimValue(editData.priority),
          designPreference: trimValue(editData.designPreference),
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
    if (id) {
      fetchProject();
    }
  }, [id]);

  const tabs = [
    { label: "Overview", path: "overview" },
    { label: "Tasks", path: "tasks" },
    { label: "Progress", path: "progress" },
    { label: "Timeline", path: "timeline" },
    { label: "Files", path: "files" },
    { label: "Updates", path: "update" },
  ];

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/dashboard/projects");
  };

  return (
    <div className="mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
      {/* Project Header */}
      <div className="mb-6 sm:mb-8">
        <div className="mb-4 flex justify-start">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-[#1d3c34]/30 hover:text-[#1d3c34]"
          >
            <FiArrowLeft size={16} />
            Back
          </button>
        </div>
        <h1 className="mb-2 break-words text-center text-2xl font-bold sm:text-3xl">
          {project?.title || "Project Not Found"}
        </h1>
        {/* Edit Button (hidden if status is pending) */}
        {project && project.status !== "pending" && (
          <div className="flex justify-center mt-4">
            <button
              className="w-full rounded bg-[#1d3c34] px-4 py-2 text-white transition-colors duration-200 hover:bg-[#145026] sm:w-auto"
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
      <div className="mb-6 sm:mb-8">
        <nav className="grid grid-cols-3 gap-2 sm:flex sm:justify-center sm:gap-6 sm:border-b sm:border-black/5 sm:pb-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={`/dashboard/projects/${id}/${tab.path}`}
              className={({ isActive }) =>
                `flex min-w-0 items-center justify-center rounded-md px-2 py-2 text-center text-xs font-medium transition-colors duration-200 sm:whitespace-nowrap sm:rounded-none sm:border-b-2 sm:px-1 sm:text-base ${
                  isActive
                    ? "bg-[#1d3c34] text-white sm:bg-transparent sm:border-[#1d3c34] sm:text-[#1d3c34] sm:font-semibold"
                    : "border border-black/5 bg-white text-gray-500 hover:text-[#1d3c34] sm:border-transparent sm:bg-transparent"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px] rounded-xl px-0 sm:px-1 lg:px-4">
        <Outlet context={{ project, refreshProject: fetchProject }} />
      </div>
    </div>
  );
}

export default ProjectDetailsPage;
