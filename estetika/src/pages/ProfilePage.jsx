import React, { useState, useEffect } from "react";
import sofaImg from "../assets/images/sofa.jpg";
import Cookies from "js-cookie";
import axios from "axios";

function ProfilePage() {
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const userCookie = Cookies.get("user");
  const user = userCookie ? JSON.parse(userCookie) : null;
  const token = Cookies.get("token");
  const [projects, setProjects] = useState([]);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    localStorage.removeItem("id");
    localStorage.removeItem("role");
    window.location.reload();
  };

  useEffect(() => {
    const fetchProjects = async () => {
      const response = await axios.get(
        `${serverUrl}/api/project?${
          user.role === "admin" ? "index=true" : `member=${user.id}`
        }`,
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
    <>
      <div className="flex w-full min-h-full gap-4 px-32">
        <div className="w-1/4 ">
          <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-md">
            <div>
              <img
                src={sofaImg}
                alt="Profile"
                className="w-32 h-32 object-cover rounded-full mb-2 ring-2 ring-pink-500 ring-offset-2"
              />
              <h2 className="text-center font-bold">
                {user?.fullName || user?.username || "Name"}
              </h2>
              <p className="text-center">{user?.role || "role"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 px-4 py-2 bg-red-400/80 text-white rounded-lg w-full font-semibold hover:bg-pink-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="flex-1 ">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="font-bold">About me</h2>
          </div>
        </div>
        <div className="w-1/4 ">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold">Project</h2>
              {/* <button className="text-sm font-bold text-pink-500">
                View All
              </button> */}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {projects && projects.length > 0 ? (
                projects.map((project) => (
                  <div key={project._id || project.id}>
                    <div className="w-24 h-24 rounded-lg bg-violet-200 mb-4"></div>
                    <p className="text-center text-xs">{project.title}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-gray-400">
                  No projects found
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;
