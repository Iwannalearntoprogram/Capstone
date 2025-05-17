import { useParams, NavLink, Outlet } from "react-router-dom";

const projects = [
  {
    id: 1,
    title: "Redesign Website",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    status: "In Progress",
    deadline: "May 31, 2025",
    assignedTo: "Jane Doe",
  },
  {
    id: 2,
    title: "Mobile App UI/UX",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    status: "Pending",
    deadline: "June 15, 2025",
    assignedTo: "John Smith",
  },
  {
    id: 3,
    title: "Landing Page Design",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    status: "Completed",
    deadline: "April 30, 2025",
    assignedTo: "Alice Brown",
  },
  {
    id: 4,
    title: "Landing Page Design",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    status: "Completed",
    deadline: "April 30, 2025",
    assignedTo: "Alice Brown",
  },
];

function ProjectDetailsPage() {
  const { id } = useParams();

  const selectedProject = projects.find((project) => project.id === Number(id));

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
          {selectedProject?.title || "Project Not Found"}
        </h1>
        {/* {selectedProject && (
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">
              <strong>Status:</strong> {selectedProject.status}
            </span>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">
              <strong>Deadline:</strong> {selectedProject.deadline}
            </span>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">
              <strong>Assigned To:</strong> {selectedProject.assignedTo}
            </span>
          </div>
        )} */}
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
        <Outlet />
      </div>
    </div>
  );
}

export default ProjectDetailsPage;
