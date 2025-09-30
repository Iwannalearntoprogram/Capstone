import { useParams, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

import ReactModal from "react-modal";
import EditProjectModal from "../components/project/EditProjectModal";

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
      setIsEditOpen(true);
    }
  };

  const closeEditModal = () => setIsEditOpen(false);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = Cookies.get("token");
      await axios.put(
        `${serverUrl}/api/project?id=${id}`,
        {
          title: editData.title,
          description: editData.description,
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
      alert("Failed to update project.");
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
  ];

  return (
    <div className=" mx-auto px-4 py-8">
      {/* Project Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-center font-bold mb-2">
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
        />
      </div>

      {/* Tabs */}
      <div className="mb-8 ">
        <nav className="flex gap-6 justify-center">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={`/dashboard/projects/${id}/${tab.path}`}
              className={({ isActive }) =>
                `py-2 px-1 border-b-2 transition-colors duration-200 ${
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
      <div className="px-20 rounded-xl  min-h-[200px]">
        <Outlet context={{ project, refreshProject: fetchProject }} />
      </div>
    </div>
  );
}

export default ProjectDetailsPage;
