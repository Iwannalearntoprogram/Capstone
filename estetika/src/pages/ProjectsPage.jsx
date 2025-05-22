import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SubNavbarProjects from "../components/SubNavbarProjects";
import Cookies from "js-cookie";
import axios from "axios";

const ProjectsPage = () => {
  const token = Cookies.get("token");
  const id = localStorage.getItem("id");
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
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
    };
    fetchProjects();
  }, []);

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
      // Refetch projects
      const response = await axios.get(
        `http://localhost:3000/api/project?projectCreator=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProjects(response.data.project);
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
      <div className="projects-overview flex-1 flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
          {projects.map((project) => {
            // Format endDate as "Month Day, Year"
            let formattedEndDate = "";
            if (project.endDate) {
              const date = new Date(project.endDate);
              formattedEndDate = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            }
            return (
              <div
                key={project.id}
                className=" bg-white rounded-xl p-6 shadow-lg overflow-visible flex flex-col h-full"
              >
                <div className="relative border-b-[1px] border-gray-200 pb-2 mb-2">
                  <h3 className="text-lg font-bold ">{project.title}</h3>
                  <button
                    className="absolute top-1/4 right-0 -translate-y-1/2 text-sm bg-[#C28383]/20 text-[#BD1E1E] rounded-lg p-4 py-2 cursor-pointer hover:bg-[#C28383]/30 transition duration-300"
                    onClick={() => handleProjectClick(project._id)}
                  >
                    View
                  </button>
                </div>

                <p className="text-sm text-gray-600 mt-1">
                  {project.description}
                </p>
                <div className="mt-4 text-sm text-gray-700">
                  <span className="block mb-1 text-[#BD1E1E] font-bold">
                    {formattedEndDate}
                  </span>
                  <span className="block">
                    {Array.isArray(project.members)
                      ? project.members.map((member, idx) => (
                          <span key={idx}>
                            {member.fullName}
                            {idx < project.members.length - 1 ? ", " : ""}
                          </span>
                        ))
                      : null}
                  </span>
                </div>
              </div>
            );
          })}
          <div
            className=" bg-white/40 rounded-xl p-6 shadow-lg overflow-visible flex flex-col h-full items-center justify-center cursor-pointer hover:bg-white/50 transition duration-300"
            onClick={() => setShowModal(true)}
          >
            <p>Add a Project</p>
            <div>+</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
