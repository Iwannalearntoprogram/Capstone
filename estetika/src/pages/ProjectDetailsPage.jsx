import { useParams, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

import ReactModal from "react-modal";
import EditProjectModal from "../components/project/EditProjectModal";
import EditPhasesModal from "../components/project/EditPhasesModal";
  // Edit phases modal state
  const [isPhasesEditOpen, setIsPhasesEditOpen] = useState(false);
  const [phasesEditData, setPhasesEditData] = useState([]);
  const [isPhasesSaving, setIsPhasesSaving] = useState(false);

  // Prepare modal data when opening
  const openPhasesEditModal = () => {
    if (project && Array.isArray(project.timeline)) {
      setPhasesEditData(project.timeline.map(phase => ({
        _id: phase._id,
        title: phase.title || "",
        startDate: phase.startDate ? phase.startDate.slice(0, 10) : "",
        endDate: phase.endDate ? phase.endDate.slice(0, 10) : "",
      })));
      setIsPhasesEditOpen(true);
    }
  };

  const closePhasesEditModal = () => setIsPhasesEditOpen(false);

  const handleChangePhase = (idx, newPhase) => {
    setPhasesEditData(prev => prev.map((p, i) => i === idx ? newPhase : p));
  };

  const handleAddPhase = () => {
    setPhasesEditData(prev => [...prev, { title: "", startDate: "", endDate: "" }]);
  };

  const handleRemovePhase = (idx) => {
    setPhasesEditData(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePhasesEditSubmit = async (e) => {
    e.preventDefault();
    setIsPhasesSaving(true);
    try {
      const token = Cookies.get("token");
      // Send phases data to backend (assume timeline update via PUT)
      await axios.put(
        `${serverUrl}/api/project?id=${id}`,
        {
          timeline: phasesEditData.map(phase => ({
            _id: phase._id,
            title: phase.title,
            startDate: phase.startDate,
            endDate: phase.endDate,
          }))
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      closePhasesEditModal();
      fetchProject();
    } catch (err) {
      alert("Failed to update phases.");
    } finally {
      setIsPhasesSaving(false);
    }
  };

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
      const projectCreator = localStorage.getItem("id");
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
      setProject(null);
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
            <button
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition-colors duration-200"
              onClick={openPhasesEditModal}
            >
              Edit Phases
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
        {/* Edit Phases Modal */}
        <EditPhasesModal
          isOpen={isPhasesEditOpen}
          onClose={closePhasesEditModal}
          onSubmit={handlePhasesEditSubmit}
          isSaving={isPhasesSaving}
          phases={phasesEditData}
          onChangePhase={handleChangePhase}
          onAddPhase={handleAddPhase}
          onRemovePhase={handleRemovePhase}
        />
      </div>

      {/* Tabs */}
      <div className="mb-8 ">
        <nav className="flex gap-6 justify-center">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={`/projects/${id}/${tab.path}`}
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
