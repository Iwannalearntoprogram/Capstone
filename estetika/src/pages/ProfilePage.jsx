import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import sofaImg from "../assets/images/sofa.jpg";
import Cookies from "js-cookie";
import axios from "axios";

function ProfilePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userCookie = Cookies.get("user");
  const user = userCookie ? JSON.parse(userCookie) : null;

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = Cookies.get("token");
        const userId = localStorage.getItem("id");

        if (!userId || !token) {
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${serverUrl}/api/project?projectCreator=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setProjects(response.data.project || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [serverUrl]);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    localStorage.removeItem("id");
    localStorage.removeItem("role");
    window.location.reload();
  };

  const handleViewAllProjects = () => {
    navigate("/projects");
  };

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}/tasks`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ongoing":
        return "bg-blue-200";
      case "completed":
        return "bg-green-200";
      case "pending":
        return "bg-yellow-200";
      case "cancelled":
        return "bg-red-200";
      default:
        return "bg-gray-200";
    }
  };

  return (
    <>
      <div className="flex w-full min-h-full gap-4 px-32">
        <div className="w-1/4 ">
          <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-md">
            <div>
              <img
                src={user?.profileImage || sofaImg}
                alt="Profile"
                className="w-32 h-32 object-cover rounded-full mb-2 ring-2 ring-[#1D3C34] ring-offset-2"
              />
              <h2 className="text-center font-bold">
                {user?.fullName || user?.username || "Name"}
              </h2>
              <p className="text-center text-gray-600">
                {user?.role || "role"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 px-4 py-2 bg-red-400 text-white rounded-lg w-full font-semibold hover:bg-red-600 transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex-1 ">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="font-bold text-xl mb-4">About me</h2>
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-gray-600">Email:</span>
                <p className="text-gray-800">{user?.email || "Not provided"}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Role:</span>
                <p className="text-gray-800 capitalize">
                  {user?.role || "Not provided"}
                </p>
              </div>
              <div>
                <span className="font-semibold text-gray-600">
                  Total Projects:
                </span>
                <p className="text-gray-800">{projects.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-1/4 ">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold">Projects</h2>
              <button
                onClick={handleViewAllProjects}
                className="text-sm font-bold text-[#1D3C34] hover:underline"
              >
                View All
              </button>
            </div>

            {loading ? (
              <div className="text-center text-gray-500 py-4">
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No projects found
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {projects.slice(0, 6).map((project) => (
                  <div
                    key={project._id}
                    className="cursor-pointer hover:scale-105 transition-transform w-24"
                    onClick={() => handleProjectClick(project._id)}
                  >
                    <div
                      className={`w-24 h-24 rounded-lg ${getStatusColor(
                        project.status
                      )} mb-2 flex items-center justify-center`}
                    >
                      <span className="text-xs font-semibold text-gray-700 text-center p-1">
                        {project.status?.charAt(0).toUpperCase() +
                          project.status?.slice(1)}
                      </span>
                    </div>
                    <p
                      className="text-center text-xs truncate w-24"
                      title={project.title}
                    >
                      {project.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;
