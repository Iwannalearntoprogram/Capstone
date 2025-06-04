import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import defaultProfile from "../assets/images/user.png";
import Cookies from "js-cookie";
import axios from "axios";

function ProfilePage() {
  const navigate = useNavigate();

  const userCookie = Cookies.get("user");
  const user = userCookie ? JSON.parse(userCookie) : null;

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    localStorage.removeItem("id");
    localStorage.removeItem("role");
    window.location.reload();
  };

  return (
    <>
      <div className="flex w-full min-h-full gap-4 px-32">
        <div className="w-1/4 ">
          <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-md">
            <div>
              <img
                src={user?.profileImage || defaultProfile}
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;
