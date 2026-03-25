import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaChevronDown } from "react-icons/fa";
import Cookies from "js-cookie";
import axios from "axios";
import ProjectCard from "../components/project/ProjectCard";
import ProjectDetailsModal from "../components/project/ProjectDetailsModal";
import ConfirmationModal from "../components/project/ConfirmationModal";
import {
  trimValue,
  validateDateOrder,
  validatePositiveNumber,
  validateRequiredText,
} from "../utils/validation";

const PROJECTS_CACHE_TTL = 5 * 60 * 1000;
const PROJECTS_CACHE_VERSION = "v1";

const getProjectsCacheKey = (role, userId) =>
  `projects-page:${PROJECTS_CACHE_VERSION}:projects:${role || "guest"}:${
    userId || "anonymous"
  }`;

const getDeletedProjectsCacheKey = (role, userId) =>
  `projects-page:${PROJECTS_CACHE_VERSION}:deleted:${role || "guest"}:${
    userId || "anonymous"
  }`;

const readProjectsCache = (cacheKey) => {
  try {
    const rawCache = sessionStorage.getItem(cacheKey);
    if (!rawCache) return null;

    const parsedCache = JSON.parse(rawCache);
    if (!parsedCache?.expiresAt || Date.now() > parsedCache.expiresAt) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }

    return parsedCache.data;
  } catch {
    sessionStorage.removeItem(cacheKey);
    return null;
  }
};

const writeProjectsCache = (cacheKey, data) => {
  try {
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        data,
        expiresAt: Date.now() + PROJECTS_CACHE_TTL,
      }),
    );
  } catch {
    // Ignore cache write failures.
  }
};

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
  const [projectFormErrors, setProjectFormErrors] = useState({});
  const [projectFormMessage, setProjectFormMessage] = useState("");
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
  const storedRole = localStorage.getItem("role");
  const projectsCacheKey = getProjectsCacheKey(storedRole, id);
  const deletedProjectsCacheKey = getDeletedProjectsCacheKey(storedRole, id);

  const handleProjectClick = (projectId) => {
    const project = projects.find((p) => p._id === projectId);

    if (userRole === "designer") {
      navigate(`/dashboard/projects/${projectId}/overview`, {
        state: { project },
      });
    } else if (userRole === "admin") {
      // If admin and project is not pending, redirect to project detail page
      if (project.status !== "pending") {
        navigate(`/dashboard/projects/${projectId}/overview`, {
          state: { project },
        });
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
        },
      );
      const nextDeletedProjects = response.data.deletedProjects || [];
      setDeletedProjects(nextDeletedProjects);
      writeProjectsCache(deletedProjectsCacheKey, nextDeletedProjects);
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
        Array.isArray(prev) ? prev.filter((p) => p._id !== projectId) : [],
      );
      setFilteredProjects((prev) =>
        Array.isArray(prev) ? prev.filter((p) => p._id !== projectId) : [],
      );
      writeProjectsCache(
        projectsCacheKey,
        Array.isArray(projects)
          ? projects.filter((project) => project._id !== projectId)
          : [],
      );
      await fetchDeletedProjects(); // Re-fetch recycle bin after deletion
    } catch {
      // Optionally show error modal
    }
    setIsDeleting(false);
    setConfirmDelete({ open: false, projectId: null });
  };

  const toggleSection = (sectionKey, target) => {
    target?.blur?.();
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
    const cachedProjects = readProjectsCache(getProjectsCacheKey(role, id));
    const cachedDeletedProjects = readProjectsCache(
      getDeletedProjectsCacheKey(role, id),
    );

    if (Array.isArray(cachedProjects)) {
      setProjects(cachedProjects);
      setFilteredProjects(cachedProjects);
    }

    if (Array.isArray(cachedDeletedProjects)) {
      setDeletedProjects(cachedDeletedProjects);
    }

    const fetchProjects = async () => {
      const response = await axios.get(
        `${serverUrl}/api/project?${
          role === "admin" ? "index=true" : `member=${id}`
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const nextProjects = response.data.project || [];
      setProjects(nextProjects);
      setFilteredProjects(nextProjects);
      writeProjectsCache(getProjectsCacheKey(role, id), nextProjects);
    };
    fetchProjects();

    // Fetch deleted projects for recycle bin
    const fetchDeletedProjects = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/project/deleted-projects`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const nextDeletedProjects = response.data.deletedProjects || [];
        setDeletedProjects(nextDeletedProjects);
        writeProjectsCache(
          getDeletedProjectsCacheKey(role, id),
          nextDeletedProjects,
        );
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
          project.title.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }
  }, [searchTerm, projects]);

  const handleAddProject = async (e) => {
    e.preventDefault();
    const nextErrors = {
      title: validateRequiredText(newProject.title, "Project title"),
      description: validateRequiredText(newProject.description, "Description"),
      budget: validatePositiveNumber(newProject.budget, "Budget"),
      dates: validateDateOrder(newProject.startDate, newProject.endDate),
    };
    setProjectFormErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setProjectFormMessage("Please fix the highlighted fields.");
      return;
    }

    try {
      setProjectFormMessage("");
      await axios.post(
        `${serverUrl}/api/project`,
        {
          ...newProject,
          title: trimValue(newProject.title),
          description: trimValue(newProject.description),
          budget: Number(newProject.budget),
          projectCreator: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setShowModal(false);
      setNewProject({
        title: "",
        description: "",
        budget: "",
        startDate: "",
        endDate: "",
      });
      setProjectFormErrors({});

      const response = await axios.get(
        `${serverUrl}/api/project?projectCreator=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const nextProjects = response.data.project || [];
      setProjects(nextProjects);
      setFilteredProjects(nextProjects);
      writeProjectsCache(projectsCacheKey, nextProjects);
    } catch (err) {
      setProjectFormMessage("Failed to add project.");
    }
  };

  const handleRestoreProject = async (deletedId) => {
    try {
      await axios.post(
        `${serverUrl}/api/project/deleted-projects/restore`,
        { id: deletedId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setDeletedProjects((prev) => prev.filter((p) => p._id !== deletedId));
      // Optionally refresh active projects
      const response = await axios.get(
        `${serverUrl}/api/project?${
          userRole === "admin" ? "index=true" : `member=${id}`
        }`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const nextProjects = response.data.project || [];
      setProjects(nextProjects);
      setFilteredProjects(nextProjects);
      writeProjectsCache(projectsCacheKey, nextProjects);
    } catch (err) {
      alert("Failed to restore project.");
    }
  };

  const handleProjectUpdated = (updatedProject) => {
    const nextProjects = Array.isArray(projects)
      ? projects.map((project) =>
          project._id === updatedProject._id ? updatedProject : project,
        )
      : projects;
    const nextFilteredProjects = Array.isArray(filteredProjects)
      ? filteredProjects.map((project) =>
          project._id === updatedProject._id ? updatedProject : project,
        )
      : filteredProjects;

    setProjects(nextProjects);
    setFilteredProjects(nextFilteredProjects);
    setSelectedProject((prev) =>
      prev?._id === updatedProject._id ? updatedProject : prev,
    );
    writeProjectsCache(
      projectsCacheKey,
      Array.isArray(nextProjects) ? nextProjects : [],
    );
  };

  const groupedProjects = {
    ongoing: Array.isArray(filteredProjects)
      ? filteredProjects.filter(
          (project) =>
            project &&
            (project.status === "ongoing" || project.status === "delayed"),
        )
      : [],
    pending: Array.isArray(filteredProjects)
      ? filteredProjects.filter(
          (project) => project && project.status === "pending",
        )
      : [],
    completed: Array.isArray(filteredProjects)
      ? filteredProjects.filter(
          (project) => project && project.status === "completed",
        )
      : [],
    cancelled: Array.isArray(filteredProjects)
      ? filteredProjects.filter(
          (project) => project && project.status === "cancelled",
        )
      : [],
  };

  const isAdmin = userRole === "admin";
  const totalProjects = projects.length;
  const visibleProjects = filteredProjects.length;
  const activeProjects =
    groupedProjects.pending.length + groupedProjects.ongoing.length;
  const completionRate =
    totalProjects > 0
      ? Math.round((groupedProjects.completed.length / totalProjects) * 100)
      : 0;

  const overviewCards = [
    {
      label: "Total projects",
      value: totalProjects,
      caption: "Across every status",
    },
    {
      label: "Active pipeline",
      value: activeProjects,
      caption: "Pending and ongoing work",
    },
    {
      label: "Completion rate",
      value: `${completionRate}%`,
      caption: `${groupedProjects.completed.length} delivered`,
    },
  ];

  const statusSectionMeta = {
    pending: {
      eyebrow: "Awaiting kickoff",
      description: "Projects being reviewed, approved, or prepared.",
      accent: "bg-amber-400",
    },
    ongoing: {
      eyebrow: "In motion",
      description: "Live projects actively moving through delivery.",
      accent: "bg-emerald-500",
    },
    completed: {
      eyebrow: "Delivered",
      description: "Finished projects that are ready for reference.",
      accent: "bg-slate-900",
    },
    cancelled: {
      eyebrow: "Archived",
      description: "Projects that are no longer moving forward.",
      accent: "bg-rose-400",
    },
  };

  const StatusSection = ({ title, projects, sectionKey }) => {
    const sectionMeta = statusSectionMeta[sectionKey];

    return (
      <section className="overflow-hidden rounded-[16px] border border-stone-200/80 bg-white/90 shadow-[0_16px_36px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => toggleSection(sectionKey, e.currentTarget)}
        >
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span
              className={`mt-0.5 hidden h-10 w-1 rounded-sm sm:block ${sectionMeta.accent}`}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">
                {sectionMeta.eyebrow}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  {title}
                </h2>
                <span className="rounded-lg bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                  {projects.length}
                </span>
              </div>
              <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
                {sectionMeta.description}
              </p>
            </div>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-slate-600 transition hover:bg-stone-100">
            <FaChevronDown
              className={`text-xs ${
                expandedSections[sectionKey] ? "rotate-180" : "rotate-0"
              }`}
            />
          </span>
        </button>

        {expandedSections[sectionKey] && (
          <div className="border-t border-stone-200/80 px-4 py-4 sm:px-5 sm:py-5">
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onView={handleProjectClick}
                    onDelete={() =>
                      setConfirmDelete({ open: true, projectId: project._id })
                    }
                    onProjectUpdated={handleProjectUpdated}
                    hideEdit={isAdmin}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[12px] border border-dashed border-stone-200 bg-stone-50/70 px-5 py-8 text-sm text-slate-500">
                No projects in this section
                {searchTerm ? " for the current search." : "."}
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[1480px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
        {/* Add Project Modal - Only show if admin */}
        {showModal && isAdmin && (
          <div className="fixed inset-0 bg-black/20 bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-xs">
            <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-md relative">
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
                    className="border rounded-md p-2 mt-1 w-full"
                    value={newProject.title}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    required
                  />
                  {projectFormErrors.title && (
                    <p className="text-red-500 text-sm mt-1">
                      {projectFormErrors.title}
                    </p>
                  )}
                </label>
                <label className="">
                  Description
                  <textarea
                    placeholder="Description"
                    className="border rounded-md p-2 mt-1 w-full"
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    required
                  />
                  {projectFormErrors.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {projectFormErrors.description}
                    </p>
                  )}
                </label>
                <label className="">
                  Budget
                  <input
                    type="number"
                    placeholder="Budget"
                    className="border rounded-md p-2 mt-1 w-full"
                    value={newProject.budget}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        budget: e.target.value,
                      }))
                    }
                    required
                  />
                  {projectFormErrors.budget && (
                    <p className="text-red-500 text-sm mt-1">
                      {projectFormErrors.budget}
                    </p>
                  )}
                </label>
                <label className="">
                  Start Date
                  <input
                    type="date"
                    className="border rounded-md p-2 mt-1 w-full"
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
                    className="border rounded-md p-2 mt-1 w-full"
                    value={newProject.endDate}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    required
                  />
                  {projectFormErrors.dates && (
                    <p className="text-red-500 text-sm mt-1">
                      {projectFormErrors.dates}
                    </p>
                  )}
                </label>
                {projectFormMessage && (
                  <p className="text-red-500 text-sm">{projectFormMessage}</p>
                )}
                <button
                  type="submit"
                  className="bg-[#1D3C34] text-white rounded-md p-2 font-semibold hover:bg-[#16442A] transition"
                >
                  Add Project
                </button>
              </form>
            </div>
          </div>
        )}

        <section className="overflow-hidden rounded-[18px] border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#fbf8f2_52%,#edf5f0_100%)] p-5 shadow-[0_24px_56px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-800/70">
                Project Workspace
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Projects
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                A cleaner overview of every project in the pipeline, from
                approvals and active delivery to completed handovers.
              </p>
            </div>

            <div className="w-full xl:max-w-[400px]">
              <div className="flex items-center gap-2.5 rounded-xl border border-stone-300/80 bg-white/90 px-4 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                <FaSearch className="shrink-0 text-xs text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by project title"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-stone-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <div className="rounded-lg border border-stone-300/80 bg-white/75 px-3.5 py-1.5 text-xs text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                  {visibleProjects} visible
                  {searchTerm ? ` for "${searchTerm}"` : ""}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setShowRecycleBin((prev) => !prev)}
                    className="rounded-lg border border-stone-300/80 bg-white/90 px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-stone-400 hover:bg-stone-50"
                  >
                    {showRecycleBin ? "Hide Recycle Bin" : "Recycle Bin"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {overviewCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[12px] border border-stone-200/80 bg-white/80 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                  {card.label}
                </p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <span className="text-2xl font-semibold tracking-tight text-slate-900">
                    {card.value}
                  </span>
                  <span className="text-right text-xs text-slate-500 sm:text-sm">
                    {card.caption}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recycle Bin Section - Only for Admin */}
        {isAdmin && showRecycleBin && (
          <section className="mt-6 overflow-hidden rounded-[16px] border border-stone-200/80 bg-white/90 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-2.5 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">
                    Archived
                  </p>
                  <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-900">
                    Recycle Bin
                  </h2>
                </div>
                <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {deletedProjects.length} item
                  {deletedProjects.length === 1 ? "" : "s"}
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-5 text-slate-500">
                Deleted projects are retained temporarily and can still be
                restored from here.
              </p>
            </div>
            <div className="border-t border-stone-200/80 px-4 py-4 sm:px-5 sm:py-5">
              {deletedProjects.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {deletedProjects.map((item) => (
                    <ProjectCard
                      key={item._id}
                      project={item.project}
                      onView={null}
                      onDelete={() => handleRestoreProject(item._id)}
                      restoreMode={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[12px] border border-dashed border-stone-200 bg-stone-50/70 px-5 py-8 text-sm text-slate-500">
                  No deleted projects.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Projects grouped by status */}
        <div className="mt-6 space-y-4">
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
    </div>
  );
};

export default ProjectsPage;
