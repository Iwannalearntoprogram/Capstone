import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import defaultProfile from "../assets/images/user.png";
import Cookies from "js-cookie";
import axios from "axios";
import api from "../services/api";

function ProfilePage() {
  const navigate = useNavigate();
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const userCookie = Cookies.get("user");
  const user = userCookie ? JSON.parse(userCookie) : null;

  useEffect(() => {
    setCurrentUser(user);
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    localStorage.removeItem("id");
    localStorage.removeItem("role");
    window.location.reload();
  };

  const handleEditProfilePicture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const token = Cookies.get("token");
      const response = await api.post(
        `${serverUrl}/api/upload/image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.imageLink) {
        // Update user data in cookies
        const updatedUser = {
          ...currentUser,
          profileImage: response.data.imageLink,
        };
        Cookies.set("user", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);

        alert("Profile picture updated successfully!");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to update profile picture. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="flex w-full min-h-full gap-4 px-32">
        {" "}
        <div className="w-1/4 ">
          <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-md">
            <div className="relative">
              <img
                src={currentUser?.profileImage || defaultProfile}
                alt="Profile"
                className="w-32 h-32 object-cover rounded-full mb-2 ring-2 ring-[#1D3C34] ring-offset-2"
              />
              <button
                onClick={handleEditProfilePicture}
                disabled={isUploading}
                className="absolute bottom-2 right-0 bg-[#1D3C34] text-white p-2 rounded-full hover:bg-[#2d5a4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                title="Change profile picture"
              >
                {isUploading ? (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <h2 className="text-center font-bold">
              {currentUser?.fullName || currentUser?.username || "Name"}
            </h2>
            <p className="text-center text-gray-600">
              {currentUser?.role || "role"}
            </p>
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
              {" "}
              <div>
                <span className="font-semibold text-gray-600">Email:</span>
                <p className="text-gray-800">
                  {currentUser?.email || "Not provided"}
                </p>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Role:</span>
                <p className="text-gray-800 capitalize">
                  {currentUser?.role || "Not provided"}
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
