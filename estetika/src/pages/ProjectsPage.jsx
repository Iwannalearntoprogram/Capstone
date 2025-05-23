import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import SubNavbarProjects from "../components/SubNavbarProjects";
import Cookies from "js-cookie";
import axios from "axios";
import ProjectCard from "../components/project/ProjectCard";

const ProjectsPage = () => {
  const token = Cookies.get("token");
  const id = localStorage.getItem("id");
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    budget: "",
    startDate: "",
    endDate: "",
  });

  const navigate = useNavigate();

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}/tasks`);
  };

  // Handle project deletion
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/project?id=${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Remove the deleted project from state
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      setFilteredProjects((prev) => prev.filter((p) => p._id !== projectId));
    } catch (err) {
      alert("Failed to delete project.");
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      const response = await axios.get(
        `http://localhost:3000/api/project?projectCreator=${id}`,
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
  }, []);

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
        "http://localhost:3000/api/project",
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
        `http://localhost:3000/api/project?projectCreator=${id}`,
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

  return (
    <div className="px-4 py-8 mx-auto">
      {showModal && (
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
              {/* ...form fields... */}
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

      {/* projects */}
      <div className="projects-overview">
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2 w-full max-w-sm  border rounded-full px-3 py-2 shadow-sm">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onView={handleProjectClick}
              onDelete={handleDeleteProject}
            />
          ))}

          <div
            className="bg-white/40 border rounded-xl p-6 shadow-md flex flex-col items-center justify-center cursor-pointer hover:bg-white/60"
            onClick={() => setShowModal(true)}
          >
            <p className="text-gray-500">Add a Project</p>
            <div className="text-2xl font-bold text-gray-700">+</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
