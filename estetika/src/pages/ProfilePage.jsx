import React, { useState, useEffect, useRef } from "react";
import defaultProfile from "../assets/images/user.png";
import Cookies from "js-cookie";
import api from "../services/api";
import { useToast } from "../components/ToastProvider";

function ProfilePage() {
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({});
  const { showToast } = useToast();

  const userCookie = Cookies.get("user");
  const user = userCookie ? JSON.parse(userCookie) : null;

  useEffect(() => {
    // Fetch user from API for latest data
    const fetchUser = async () => {
      try {
        const token = Cookies.get("token");
        const response = await api.get(
          `${serverUrl}/api/user/data?id=${user?._id || user?.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response?.data?.user) {
          setCurrentUser(response.data.user);
          Cookies.set("user", JSON.stringify(response.data.user));
        }
      } catch {
        setCurrentUser(user); // fallback to cookie
      }
    };
    fetchUser();
  }, [serverUrl, user]);
  // Helper: get editable fields by role

  // Helper: get display fields by role
  const getDisplayFields = () => {
    if (!currentUser) return [];
    // Always show firstName and lastName fields when editing
    let fields = [];
    if (editMode) {
      fields = [
        { label: "First Name", key: "firstName" },
        { label: "Last Name", key: "lastName" },
      ];
    } else {
      fields = [{ label: "Full Name", key: "fullName" }];
    }
    if (["admin", "storage_admin"].includes(currentUser.role)) {
      fields = fields.concat([
        { label: "Birthday", key: "birthday" },
        { label: "Email", key: "email" },
        { label: "Department", key: "department" },
        { label: "Bio", key: "aboutMe" },
        { label: "Phone Number", key: "phoneNumber" },
        { label: "Address", key: "address" },
        { label: "LinkedIn", key: "linkedIn" },
        { label: "Date Joined", key: "createdAt" },
        { label: "Employee ID", key: "employeeId" },
        { label: "Emergency Contact Information", key: "emergencyContactInfo" },
      ]);
    } else if (currentUser.role === "designer") {
      // Designers: display all details (same list as admin), but only some are editable
      fields = fields.concat([
        { label: "Birthday", key: "birthday" },
        { label: "Email", key: "email" },
        { label: "Department", key: "department" },
        { label: "Bio", key: "aboutMe" },
        { label: "Phone Number", key: "phoneNumber" },
        { label: "Address", key: "address" },
        { label: "LinkedIn", key: "linkedIn" },
        { label: "Date Joined", key: "createdAt" },
        { label: "Employee ID", key: "employeeId" },
        { label: "Emergency Contact Information", key: "emergencyContactInfo" },
      ]);
    }
    return fields;
  };

  // For designers, allow editing full name, bio, and date joined
  const getEditableFields = () => {
    if (!currentUser) return [];
    // Designer: only Full Name (first/last), Bio, and Date Joined
    if (currentUser.role === "designer") {
      return ["firstName", "lastName", "aboutMe", "createdAt", "profileImage"];
    }
    // Other roles
    let fields = ["firstName", "lastName", "profileImage"];
    if (["admin", "storage_admin"].includes(currentUser.role)) {
      fields = fields.concat([
        "birthday",
        "email",
        "department",
        "aboutMe",
        "phoneNumber",
        "address",
        "linkedIn",
        "employeeId",
        "emergencyContactInfo",
      ]);
    }
    return fields;
  };

  // Handle edit button
  const handleEdit = () => {
    setEditFields({ ...currentUser });
    setEditMode(true);
  };

  // Handle field change
  const handleFieldChange = (field, value) => {
    setEditFields((prev) => ({ ...prev, [field]: value }));
  };

  // Handle save
  const handleSave = async () => {
    if (!currentUser) return;
    const token = Cookies.get("token");
    // Only send changed fields
    const payload = {};
    let firstNameChanged = false;
    let lastNameChanged = false;
    getEditableFields().forEach((field) => {
      if (
        editFields[field] !== undefined &&
        editFields[field] !== currentUser[field]
      ) {
        payload[field] = editFields[field];
        if (field === "firstName") firstNameChanged = true;
        if (field === "lastName") lastNameChanged = true;
      }
    });
    // If firstName or lastName changed, update fullName as well
    if (firstNameChanged || lastNameChanged) {
      const newFirst =
        editFields.firstName !== undefined
          ? editFields.firstName
          : currentUser.firstName || "";
      const newLast =
        editFields.lastName !== undefined
          ? editFields.lastName
          : currentUser.lastName || "";
      payload.fullName = `${newFirst} ${newLast}`.trim();
    }
    if (Object.keys(payload).length === 0) {
      setEditMode(false);
      return;
    }
    try {
      const response = await api.put(
        `${serverUrl}/api/user?id=${currentUser._id || currentUser.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrentUser(response.data.user);
      Cookies.set("user", JSON.stringify(response.data.user));
      setEditMode(false);
      showToast("Profile updated successfully!", { type: "success" });
    } catch {
      showToast("Failed to update profile.", { type: "error" });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditMode(false);
    setEditFields({});
  };

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
      showToast("Please select an image file", { type: "error" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB", { type: "error" });
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
        setEditFields((prev) => ({
          ...prev,
          profileImage: response.data.imageLink,
        }));

        showToast("Profile picture updated!", { type: "success" });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("Failed to update profile picture. Please try again.", {
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex w-full min-h-full gap-4 px-32">
      <div className="w-1/4">
        <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-md">
          <div className="relative">
            <img
              src={currentUser?.profileImage || defaultProfile}
              alt="Profile"
              className="w-32 h-32 object-cover rounded-full mb-2 ring-2 ring-[#1D3C34] ring-offset-2"
            />
            {editMode && getEditableFields().includes("profileImage") && (
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
                    />
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
                      d="M11 4h2a2 2 0 012 2v2m-8 6v4h4l8-8a2 2 0 10-4-4l-8 8z"
                    />
                  </svg>
                )}
              </button>
            )}
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
            {(() => {
              const roleMap = {
                admin: "Administrator",
                designer: "Designer",
                client: "Client",
                storage_admin: "Storage Administrator",
              };
              return roleMap[currentUser?.role] || currentUser?.role || "Role";
            })()}
          </p>
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-[#1d3c34] text-white rounded-lg w-full font-semibold hover:bg-[#626c38] transition cursor-pointer"
          >
            Logout
          </button>
          {!editMode && getEditableFields().length > 0 && (
            <button
              onClick={handleEdit}
              className="mt-2 px-4 py-2 bg-[#46280e] text-white rounded-lg w-full font-semibold hover:bg-[#88571f] transition cursor-pointer"
            >
              Edit Profile
            </button>
          )}
          {editMode && (
            <div className="flex gap-2 mt-2 w-full">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-700 transition cursor-pointer w-1/2"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-600 transition cursor-pointer w-1/2"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="font-bold text-xl mb-4">About me</h2>
          <div className="space-y-3">
            {getDisplayFields().map(({ label, key }) => (
              <div key={key} className="flex flex-col mb-2">
                <span className="font-semibold text-gray-600">{label}:</span>
                {editMode && getEditableFields().includes(key) ? (
                  key === "aboutMe" ? (
                    <textarea
                      value={editFields[key] || ""}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className="border rounded px-2 py-1 min-h-[80px]"
                    />
                  ) : (
                    <input
                      type={
                        key === "birthday" || key === "createdAt"
                          ? "date"
                          : "text"
                      }
                      value={
                        key === "createdAt"
                          ? editFields[key]
                            ? new Date(editFields[key])
                                .toISOString()
                                .slice(0, 10)
                            : ""
                          : editFields[key] || ""
                      }
                      onChange={(e) =>
                        handleFieldChange(
                          key,
                          key === "createdAt" ? e.target.value : e.target.value
                        )
                      }
                      className="border rounded px-2 py-1"
                    />
                  )
                ) : key === "fullName" ? (
                  <p className="text-gray-800">
                    {currentUser?.fullName || "Not provided"}
                  </p>
                ) : (
                  <p className="text-gray-800">
                    {key === "birthday" && currentUser?.birthday
                      ? new Date(currentUser.birthday).toLocaleDateString()
                      : key === "createdAt" && currentUser?.createdAt
                      ? new Date(currentUser.createdAt).toLocaleDateString()
                      : currentUser?.[key] || "Not provided"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
