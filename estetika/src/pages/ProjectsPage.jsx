import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaChevronDown, FaChevronUp, FaPlus } from "react-icons/fa";
import SubNavbarProjects from "../components/SubNavbarProjects";
import Cookies from "js-cookie";
import axios from "axios";
import ProjectCard from "../components/project/ProjectCard";
import ProjectDetailsModal from "../components/project/ProjectDetailsModal";
import ConfirmationModal from "../components/project/ConfirmationModal";

const ProjectsPage = () => {
  const token = Cookies.get("token");
  const id = localStorage.getItem("id");
  const [userRole, setUserRole] = useState(null);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    ongoing: true,
    pending: true,
    completed: false,
    cancelled: false,
  });
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    budget: "",
    startDate: "",
    endDate: "",
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deletedProjects, setDeletedProjects] = useState([]);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    projectId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  const handleProjectClick = (projectId) => {
    const project = projects.find((p) => p._id === projectId);

    if (userRole === "designer") {
      navigate(`/projects/${projectId}/overview`, { state: { project } });
    } else if (userRole === "admin") {
      // If admin and project is not pending, redirect to project detail page
      if (project.status !== "pending") {
        navigate(`/projects/${projectId}/overview`, { state: { project } });
      } else {
        // If pending, show the modal for adding designers
        setSelectedProject(project);
        setShowDetailsModal(true);
      }
    } else {
      setSelectedProject(project);
      setShowDetailsModal(true);
    }
  };

  // Fetch deleted projects for recycle bin
  const fetchDeletedProjects = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/project/deleted-projects`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDeletedProjects(response.data.deletedProjects || []);
    } catch {
      setDeletedProjects([]);
    }
  };

  const handleDeleteProject = async (projectId) => {
    setIsDeleting(true);
    try {
      await axios.delete(`${serverUrl}/api/project?id=${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProjects((prev) =>
        Array.isArray(prev) ? prev.filter((p) => p._id !== projectId) : []
      );
      setFilteredProjects((prev) =>
        Array.isArray(prev) ? prev.filter((p) => p._id !== projectId) : []
      );
      await fetchDeletedProjects(); // Re-fetch recycle bin after deletion
    } catch {
      // Optionally show error modal
    }
    setIsDeleting(false);
    setConfirmDelete({ open: false, projectId: null });
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);

    const fetchProjects = async () => {
      const response = await axios.get(
        `${serverUrl}/api/project?${
          role === "admin" ? "index=true" : `member=${id}`
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProjects(response.data.project);
      setFilteredProjects(response.data.project);
    };
    fetchProjects();

    // Fetch deleted projects for recycle bin
    const fetchDeletedProjects = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/project/deleted-projects`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDeletedProjects(response.data.deletedProjects || []);
      } catch {
        setDeletedProjects([]);
      }
    };
    fetchDeletedProjects();
  }, [id, serverUrl, token]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(
        projects.filter((project) =>
          project.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, projects]);

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${serverUrl}/api/project`,
        {
          ...newProject,
          budget: Number(newProject.budget),
          projectCreator: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setShowModal(false);
      setNewProject({
        title: "",
        description: "",
        budget: "",
        startDate: "",
        endDate: "",
      });

      const response = await axios.get(
        `${serverUrl}/api/project?projectCreator=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProjects(response.data.project);
      setFilteredProjects(response.data.project);
    } catch (err) {
      alert("Failed to add project.");
    }
  };

  const handleRestoreProject = async (deletedId) => {
    try {
      await axios.post(
        `${serverUrl}/api/project/deleted-projects/restore`,
        { id: deletedId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDeletedProjects((prev) => prev.filter((p) => p._id !== deletedId));
      // Optionally refresh active projects
      const response = await axios.get(
        `${serverUrl}/api/project?${
          userRole === "admin" ? "index=true" : `member=${id}`
        }`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects(response.data.project);
      setFilteredProjects(response.data.project);
    } catch (err) {
      alert("Failed to restore project.");
    }
  };

  const groupedProjects = {
    ongoing: Array.isArray(filteredProjects)
      ? filteredProjects.filter(
          (project) =>
            project &&
            (project.status === "ongoing" || project.status === "delayed")
        )
      : [],
    pending: Array.isArray(filteredProjects)
      ? filteredProjects.filter(
          (project) => project && project.status === "pending"
        )
      : [],
    completed: Array.isArray(filteredProjects)
      ? filteredProjects.filter(
          (project) => project && project.status === "completed"
        )
      : [],
    cancelled: Array.isArray(filteredProjects)
      ? filteredProjects.filter(
          (project) => project && project.status === "cancelled"
        )
      : [],
  };

  const StatusSection = ({ title, projects, sectionKey }) => (
    <div className="mb-4">
      <div
        className="flex items-center justify-between p-3 rounded-lg cursor-pointer bg-gray-50 transition border"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800">
            {title} ({projects.length})
          </h2>
        </div>
        {expandedSections[sectionKey] ? (
          <FaChevronUp className="text-gray-600" />
        ) : (
          <FaChevronDown className="text-gray-600" />
        )}
      </div>

      {expandedSections[sectionKey] && (
        <div className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onView={handleProjectClick}
                onDelete={() =>
                  setConfirmDelete({ open: true, projectId: project._id })
                }
                hideEdit={isAdmin}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const isAdmin = userRole === "admin";

  return (
    <div className="px-4 py-8 mx-auto">
      {/* Add Project Modal - Only show if admin */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-8 shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-4 text-gray-500 text-2xl"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Add New Project</h2>
            <form onSubmit={handleAddProject} className="flex flex-col gap-4">
              <label className="">
                Project Title
                <input
                  type="text"
                  placeholder="Project Title"
                  className="border rounded p-2 mt-1 w-full"
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="">
                Description
                <textarea
                  placeholder="Description"
                  className="border rounded p-2 mt-1 w-full"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="">
                Budget
                <input
                  type="number"
                  placeholder="Budget"
                  className="border rounded p-2 mt-1 w-full"
                  value={newProject.budget}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      budget: e.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="">
                Start Date
                <input
                  type="date"
                  className="border rounded p-2 mt-1 w-full"
                  value={newProject.startDate}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="">
                End Date
                <input
                  type="date"
                  className="border rounded p-2 mt-1 w-full"
                  value={newProject.endDate}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  required
                />
              </label>
              <button
                type="submit"
                className="bg-[#1D3C34] text-white rounded p-2 font-semibold hover:bg-[#16442A] transition"
              >
                Add Project
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Search Bar and Add Project Button */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 w-full max-w-sm border rounded-full px-3 py-2 shadow-sm">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Admin Add Project button */}
          {/*
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#1D3C34] text-white px-4 py-2 rounded-full hover:bg-[#16442A] transition flex items-center gap-2 whitespace-nowrap"
            >
              <FaPlus size={14} />
              Add Project
            </button>
          )}
          */}
          {isAdmin && (
            <button
              onClick={() => setShowRecycleBin((prev) => !prev)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-300 transition flex items-center gap-2 whitespace-nowrap"
            >
              Recycle Bin
            </button>
          )}
        </div>
      </div>

      {/* Recycle Bin Section - Only for Admin */}
      {isAdmin && showRecycleBin && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">
            Recycle Bin ({deletedProjects.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {deletedProjects.map((item) => (
              <ProjectCard
                key={item._id}
                project={item.project}
                onView={null}
                onDelete={() => handleRestoreProject(item._id)}
                restoreMode={true}
              />
            ))}
            {deletedProjects.length === 0 && (
              <div className="text-gray-500">No deleted projects.</div>
            )}
          </div>
        </div>
      )}

      {/* Projects grouped by status */}
      <div className="projects-overview">
        <StatusSection
          title="Pending Projects"
          projects={groupedProjects.pending}
          sectionKey="pending"
        />

        <StatusSection
          title="Ongoing Projects"
          projects={groupedProjects.ongoing}
          sectionKey="ongoing"
        />

        <StatusSection
          title="Completed Projects"
          projects={groupedProjects.completed}
          sectionKey="completed"
        />

        <StatusSection
          title="Cancelled Projects"
          projects={groupedProjects.cancelled}
          sectionKey="cancelled"
        />
      </div>

      {showDetailsModal && selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={confirmDelete.open}
        title="Delete Project"
        message="Are you sure you want to delete this project? This will move it to the recycle bin for 30 days."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={() => handleDeleteProject(confirmDelete.projectId)}
        onCancel={() => setConfirmDelete({ open: false, projectId: null })}
        isProcessing={isDeleting}
      />
    </div>
  );
};

export default ProjectsPage;
