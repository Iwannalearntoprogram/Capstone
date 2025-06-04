import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  FaUser,
  FaPhone,
  FaBriefcase,
  FaEnvelope,
  FaLock,
  FaUserTag,
  FaPlus,
  FaTrash,
  FaUserShield,
  FaUserTie,
  FaUsers,
} from "react-icons/fa";
import defaultProfile from "../assets/images/user.png";

export default function UsersPage() {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    role: "designer",
  });

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const token = Cookies.get("token");
        const response = await axios.get(`${serverUrl}/api/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [serverUrl]);

  // Filter users based on active tab
  const filteredUsers = users.filter((user) => {
    if (activeTab === "all") return true;
    return user.role === activeTab;
  });

  // Get user counts for each role
  const getUserCount = (role) => {
    if (role === "all") return users.length;
    return users.filter((user) => user.role === role).length;
  };

  const tabs = [
    {
      id: "all",
      label: "All Users",
      icon: FaUsers,
      count: getUserCount("all"),
    },
    {
      id: "admin",
      label: "Admin",
      icon: FaUserShield,
      count: getUserCount("admin"),
    },
    {
      id: "designer",
      label: "Designer",
      icon: FaUserTie,
      count: getUserCount("designer"),
    },
    {
      id: "client",
      label: "Client",
      icon: FaUser,
      count: getUserCount("client"),
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const token = Cookies.get("token");
      const response = await axios.post(
        `${serverUrl}/api/auth/register`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
      // Refresh users list
      fetchUsers();
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        setShowModal(false);
        setMessage("");
      }, 2000);
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

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = Cookies.get("token");
      const response = await axios.get(`${serverUrl}/api/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setMessage("");
    setFormData({
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phoneNumber: "",
      role: "designer",
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "designer":
        return "bg-blue-100 text-blue-800";
      case "client":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6">
          <div className="bg-[#1D3C34] px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FaUser className="w-6 h-6" />
                  Users Management
                </h1>
                <p className="text-emerald-100 mt-1">
                  Manage and view all system users
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-white text-[#1D3C34] px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center gap-2"
              >
                <FaPlus />
                Add User
              </button>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? "border-[#1D3C34] text-[#1D3C34]"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <span
                      className={`${
                        activeTab === tab.id
                          ? "bg-[#1D3C34] text-white"
                          : "bg-gray-100 text-gray-600"
                      } ml-2 py-0.5 px-2.5 rounded-lg text-xs font-medium transition-colors`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
        {/* Users List */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-6">
            {loadingUsers ? (
              <div className="text-center py-20">
                <div className="text-gray-500">Loading users...</div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-20">
                <FaUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No users found
                </h3>
                <p className="text-gray-500">
                  {activeTab === "all"
                    ? "Start by adding your first user to the system."
                    : `No ${activeTab} users found.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        User
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        Phone
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        Role
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.profileImage || defaultProfile}
                              alt="Profile"
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div>
                              <div className="font-semibold text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-900">{user.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-900">
                            {user.phoneNumber}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-semibold ${getRoleColor(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-[#1D3C34] px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FaUser className="w-6 h-6" />
                  Add New User
                </h1>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
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

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaUserTag
                      className="w-4 h-4"
                      style={{ color: "#1D3C34" }}
                    />
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
                      <FaUser
                        className="w-4 h-4"
                        style={{ color: "#1D3C34" }}
                      />
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
                      <FaUser
                        className="w-4 h-4"
                        style={{ color: "#1D3C34" }}
                      />
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
                  onClick={closeModal}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
