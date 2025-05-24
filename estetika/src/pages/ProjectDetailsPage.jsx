import { useParams, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

function ProjectDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const [project, setProject] = useState(location.state?.project || null);

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  const fetchProject = async () => {
    try {
      const projectCreator = localStorage.getItem("id");
      const token = Cookies.get("token");
      const response = await axios.get(
        `${serverUrl}/api/project?projectCreator=${projectCreator}&id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
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
    { label: "Tasks", path: "tasks" },
    { label: "Progress", path: "progress" },
    { label: "Timeline", path: "timeline" },
    // Add more tabs as needed
  ];

  return (
    <div className=" mx-auto px-4 py-8">
      {/* Project Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-center font-bold mb-2">
          {project?.title || "Project Not Found"}
        </h1>
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
