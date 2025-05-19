import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SubNavbarProjects from "../components/SubNavbarProjects"; // Import SubNavbar
import Cookies from "js-cookie";
import axios from "axios";

const ProjectsPage = () => {
  const token = Cookies.get("token");
  const id = localStorage.getItem("id");
  const [projects, setProjects] = useState([]);

  // let projects = [
  //   {
  //     id: 1,
  //     title: "Redesign Website",
  //     description:
  //       "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  //     status: "In Progress",
  //     deadline: "May 31, 2025",
  //     assignedTo: "Jane Doe",
  //   },
  //   {
  //     id: 2,
  //     title: "Mobile App UI/UX",
  //     description:
  //       "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  //     status: "Pending",
  //     deadline: "June 15, 2025",
  //     assignedTo: "John Smith",
  //   },
  //   {
  //     id: 3,
  //     title: "Landing Page Design",
  //     description:
  //       "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  //     status: "Completed",
  //     deadline: "April 30, 2025",
  //     assignedTo: "Alice Brown",
  //   },
  //   {
  //     id: 4,
  //     title: "Landing Page Design",
  //     description:
  //       "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  //     status: "Completed",
  //     deadline: "April 30, 2025",
  //     assignedTo: "Alice Brown",
  //   },
  // ];

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

  return (
    <div className="px-4 py-8 mx-auto">
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
                className=" bg-white rounded-xl p-6 shadow-lg overflow-visible flex flex-col h-full before:content-[''] before:absolute before:top-2 before:left-2 before:w-full before:h-full before:bg-gray-100 before:rounded-xl before:-z-10 after:content-[''] after:absolute after:top-4 after:left-4 after:w-full after:h-full after:bg-gray-200 after:rounded-xl after:-z-20"
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
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
