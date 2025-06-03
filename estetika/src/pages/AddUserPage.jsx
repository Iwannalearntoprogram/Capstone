import React, { useState } from "react";
import axios from "axios";
import {
  FaCamera,
  FaUser,
  FaPhone,
  FaBriefcase,
  FaEnvelope,
  FaLock,
  FaUserTag,
} from "react-icons/fa";

export default function AddUserPage() {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    role: "designer",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        `${serverUrl}/api/auth/register`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("User created successfully:", response.data);
      setMessage("User created successfully!");
      // Reset form
      setFormData({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phoneNumber: "",
        role: "designer",
      });
      setImagePreview(null);
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while creating the user";
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 mt-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div
          className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4"
          style={{ backgroundColor: "#1D3C34" }}
        >
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaUser className="w-6 h-6" />
            Add New User
          </h1>
        </div>

        <div className="p-6 sm:p-8">
          {/* Success/Error Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.includes("successfully")
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Photo Section */}
            <div className="lg:col-span-1 flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-emerald-100 overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUser className="w-12 h-12 text-emerald-600" />
                  )}
                </div>
                <label
                  htmlFor="photo-upload"
                  className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center cursor-pointer transition-all duration-200"
                >
                  <FaCamera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>
              <p className="text-sm text-gray-500 mt-3 text-center">
                Click to upload photo
              </p>
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaUserTag className="w-4 h-4" style={{ color: "#1D3C34" }} />
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter username"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaUser className="w-4 h-4" style={{ color: "#1D3C34" }} />
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter first name"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaUser className="w-4 h-4" style={{ color: "#1D3C34" }} />
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter last name"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaEnvelope
                    className="w-4 h-4"
                    style={{ color: "#1D3C34" }}
                  />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter email address"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaLock className="w-4 h-4" style={{ color: "#1D3C34" }} />
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter password"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaPhone className="w-4 h-4" style={{ color: "#1D3C34" }} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter phone number"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaBriefcase
                    className="w-4 h-4"
                    style={{ color: "#1D3C34" }}
                  />
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1D3C34] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                  required
                  disabled={isLoading}
                >
                  <option value="admin">Admin</option>
                  <option value="designer">Designer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-[#1D3C34] to-[#145c4b] text-white px-6 py-3 rounded-lg font-semibold hover:from-[#145c4b] hover:to-[#0e3d29] focus:ring-2 focus:ring-[#1D3C34] focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating User..." : "Create User"}
            </button>
            <button
              type="button"
              disabled={isLoading}
              className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
