import React, { useEffect, useRef, useState } from "react";
import ProfileImage from "../components/common/ProfileImage";
import Cookies from "js-cookie";
import api from "../services/api";
import { useToast } from "../components/ToastProvider";
import {
  normalizePhone,
  sanitizeNameInput,
  trimValue,
  validateEmail,
  validatePhilippinePhone,
  validateNameWithoutNumbers,
  validateUrl,
} from "../utils/validation";

const ROLE_LABELS = {
  admin: "Administrator",
  designer: "Designer",
  client: "Client",
  storage_admin: "Storage Administrator",
};

const DETAILED_ROLES = new Set(["admin", "storage_admin", "designer"]);

const formatDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const formatDisplayDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
};

const getRoleLabel = (role) => ROLE_LABELS[role] || role || "Team member";

const getProfileSections = (currentUser, editMode) => {
  if (!currentUser) return [];

  const identityFields = editMode
    ? [
        { label: "First Name", key: "firstName" },
        { label: "Last Name", key: "lastName" },
      ]
    : [{ label: "Full Name", key: "fullName" }];

  if (!DETAILED_ROLES.has(currentUser.role)) {
    return [
      {
        title: "Profile",
        description: "Basic account details.",
        fields: identityFields,
      },
      {
        title: "Contact",
        description: "Ways to reach you.",
        fields: [{ label: "Email", key: "email" }],
      },
      {
        title: "About",
        description: "Personal summary.",
        fields: [{ label: "Bio", key: "aboutMe" }],
      },
    ];
  }

  return [
    {
      title: "Profile",
      description: "Core identity details used across the workspace.",
      fields: [
        ...identityFields,
        { label: "Birthday", key: "birthday" },
        { label: "Date Joined", key: "createdAt" },
      ],
    },
    {
      title: "Work",
      description: "Internal information for your role and team.",
      fields: [
        { label: "Department", key: "department" },
        { label: "Employee ID", key: "employeeId" },
      ],
    },
    {
      title: "Contact",
      description: "Public and emergency contact details.",
      fields: [
        { label: "Email", key: "email" },
        { label: "Phone Number", key: "phoneNumber" },
        { label: "Address", key: "address" },
        { label: "LinkedIn", key: "linkedIn" },
        {
          label: "Emergency Contact Information",
          key: "emergencyContactInfo",
        },
      ],
    },
    {
      title: "About",
      description: "Short professional summary.",
      fields: [{ label: "Bio", key: "aboutMe", fullWidth: true }],
    },
  ];
};

function ProfilePage() {
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const userCookie = Cookies.get("user");
  const initialUser = userCookie ? JSON.parse(userCookie) : null;

  const [isUploading, setIsUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get("token");
        const userId = initialUser?._id || initialUser?.id;
        if (!userId) return;

        const response = await api.get(
          `${serverUrl}/api/user/data?id=${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response?.data?.user) {
          setCurrentUser(response.data.user);
          Cookies.set("user", JSON.stringify(response.data.user));
        }
      } catch {
        setCurrentUser(initialUser);
      }
    };

    fetchUser();
  }, [initialUser?._id, initialUser?.id, serverUrl]);

  const getEditableFields = () => {
    if (!currentUser) return [];

    if (currentUser.role === "designer") {
      return ["firstName", "lastName", "aboutMe", "createdAt", "profileImage"];
    }

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

  const editableFields = getEditableFields();
  const profileSections = getProfileSections(currentUser, editMode);
  const aboutSection = profileSections.find((section) => section.title === "About");
  const mainSections = profileSections.filter((section) => section.title !== "About");

  const validateProfileField = (field, value) => {
    switch (field) {
      case "firstName":
        return validateNameWithoutNumbers(value, "First name");
      case "lastName":
        return validateNameWithoutNumbers(value, "Last name");
      case "email":
        return validateEmail(value);
      case "phoneNumber": {
        const normalized = normalizePhone(value);
        return normalized ? validatePhilippinePhone(normalized) : "";
      }
      case "linkedIn":
        return trimValue(value)
          ? validateUrl(value, "LinkedIn URL", { allowBlank: false })
          : "";
      case "birthday":
      case "createdAt":
        if (!value) return "";
        return Number.isNaN(new Date(value).getTime())
          ? "Enter a valid date."
          : "";
      default:
        return "";
    }
  };

  const validateProfileForm = () => {
    const nextErrors = {};

    editableFields.forEach((field) => {
      nextErrors[field] = validateProfileField(field, editFields[field]);
    });

    setEditErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleFieldChange = (field, value) => {
    const normalizedValue =
      field === "firstName" || field === "lastName"
        ? sanitizeNameInput(value)
        : value;
    setEditFields((prev) => ({ ...prev, [field]: normalizedValue }));
    setSaveError("");
    setEditErrors((prev) => ({
      ...prev,
      [field]: validateProfileField(field, normalizedValue),
    }));
  };

  const handleEdit = () => {
    setEditFields({ ...currentUser });
    setEditErrors({});
    setSaveError("");
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!currentUser) return;

    if (!validateProfileForm()) {
      setSaveError("Please fix the highlighted fields.");
      return;
    }

    const token = Cookies.get("token");
    const payload = {};
    let firstNameChanged = false;
    let lastNameChanged = false;

    editableFields.forEach((field) => {
      if (
        editFields[field] !== undefined &&
        editFields[field] !== currentUser[field]
      ) {
        payload[field] =
          field === "email"
            ? trimValue(editFields[field]).toLowerCase()
            : field === "phoneNumber"
              ? normalizePhone(editFields[field])
              : typeof editFields[field] === "string"
                ? trimValue(editFields[field])
                : editFields[field];

        if (field === "firstName") firstNameChanged = true;
        if (field === "lastName") lastNameChanged = true;
      }
    });

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
        },
      );

      setCurrentUser(response.data.user);
      Cookies.set("user", JSON.stringify(response.data.user));
      setEditMode(false);
      showToast("Profile updated successfully!", { type: "success" });
    } catch {
      setSaveError("Failed to update profile.");
      showToast("Failed to update profile.", { type: "error" });
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditFields({});
    setEditErrors({});
    setSaveError("");
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

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", { type: "error" });
      return;
    }

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
        },
      );

      if (response.data.imageLink) {
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
      event.target.value = "";
    }
  };

  const renderDisplayValue = (key) => {
    const value =
      key === "fullName"
        ? currentUser?.fullName || currentUser?.username
        : currentUser?.[key];

    if (!value) {
      return <p className="text-sm text-[#8b857d]">Not provided</p>;
    }

    if (key === "birthday" || key === "createdAt") {
      return (
        <p className="text-sm font-medium text-[#1f2937]">
          {formatDisplayDate(value)}
        </p>
      );
    }

    if (key === "linkedIn") {
      return (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-[#1d3c34] underline decoration-[#c7b59a] underline-offset-4"
        >
          View profile
        </a>
      );
    }

    if (key === "email") {
      return (
        <a
          href={`mailto:${value}`}
          className="text-sm font-medium text-[#1f2937] hover:text-[#1d3c34]"
        >
          {value}
        </a>
      );
    }

    if (key === "phoneNumber") {
      return (
        <a
          href={`tel:${value}`}
          className="text-sm font-medium text-[#1f2937] hover:text-[#1d3c34]"
        >
          {value}
        </a>
      );
    }

    return <p className="text-sm font-medium text-[#1f2937]">{value}</p>;
  };

  const blockDigitKeys = (event) => {
    if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !/[A-Za-z]/.test(event.key)
    ) {
      event.preventDefault();
    }
  };

  const renderField = ({ label, key, fullWidth }) => {
    const isEditable = editMode && editableFields.includes(key);
    const inputType =
      key === "birthday" || key === "createdAt" ? "date" : "text";
    const inputValue =
      key === "birthday" || key === "createdAt"
        ? formatDateInputValue(editFields[key])
        : editFields[key] || "";

    return (
      <div
        key={key}
        className={`rounded-2xl border border-[#e7e0d7] bg-[#fcfbf8] p-4 ${
          fullWidth ? "md:col-span-2" : ""
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b857d]">
          {label}
        </p>

        {isEditable ? (
          <div className="mt-3">
            {key === "aboutMe" ? (
              <textarea
                value={editFields[key] || ""}
                onChange={(event) => handleFieldChange(key, event.target.value)}
                className="min-h-[140px] w-full rounded-2xl border border-[#d9d2c8] bg-white px-4 py-3 text-sm text-[#1f2937] outline-none transition focus:border-[#1d3c34] focus:ring-2 focus:ring-[#d5e0db]"
                placeholder="Add a short summary"
              />
            ) : (
              <input
                type={inputType}
                value={inputValue}
                onChange={(event) => handleFieldChange(key, event.target.value)}
                onKeyDown={
                  key === "firstName" || key === "lastName"
                    ? blockDigitKeys
                    : undefined
                }
                inputMode={
                  key === "firstName" || key === "lastName" ? "text" : undefined
                }
                className="w-full rounded-2xl border border-[#d9d2c8] bg-white px-4 py-3 text-sm text-[#1f2937] outline-none transition focus:border-[#1d3c34] focus:ring-2 focus:ring-[#d5e0db]"
              />
            )}

            {editErrors[key] && (
              <p className="mt-2 text-sm text-[#b42318]">{editErrors[key]}</p>
            )}
          </div>
        ) : (
          <div className="mt-3">{renderDisplayValue(key)}</div>
        )}
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#e7e0d7] bg-white p-8 shadow-sm">
          <p className="text-sm text-[#6b7280]">Loading profile...</p>
        </div>
      </div>
    );
  }

  const summaryItems = [
    { label: "Email", value: currentUser.email },
    { label: "Phone", value: currentUser.phoneNumber },
    { label: "Department", value: currentUser.department },
  ].filter((item) => item.value);

  return (
    <div className="min-h-full bg-[#f5f1ea] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[28px] border border-[#ddd4c7] bg-gradient-to-br from-white via-[#fbf8f3] to-[#f1e8dc] shadow-[0_24px_60px_-42px_rgba(29,60,52,0.45)]">
          <div className="flex flex-col gap-8 p-6 sm:p-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                <ProfileImage
                  src={currentUser.profileImage}
                  alt="Profile"
                  className="h-28 w-28 rounded-[2rem] object-cover shadow-[0_20px_45px_-28px_rgba(29,60,52,0.65)] ring-1 ring-[#d5cbbe]"
                />

                {editMode && editableFields.includes("profileImage") && (
                  <button
                    onClick={handleEditProfilePicture}
                    disabled={isUploading}
                    className="absolute -bottom-2 right-0 rounded-full bg-[#1d3c34] px-3 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-[#2a564a] disabled:cursor-not-allowed disabled:opacity-60"
                    title="Change profile picture"
                  >
                    {isUploading ? "Uploading..." : "Change"}
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

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b857d]">
                    Profile
                  </p>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-[#1d2430]">
                      {currentUser.fullName ||
                        currentUser.username ||
                        "Unnamed User"}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-[#d4c9bb] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#1d3c34]">
                        {getRoleLabel(currentUser.role)}
                      </span>
                      <span className="text-sm text-[#6b7280]">
                        Member since{" "}
                        {formatDisplayDate(currentUser.createdAt) ||
                          "Not available"}
                      </span>
                    </div>
                  </div>
                </div>

                {summaryItems.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {summaryItems.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 backdrop-blur"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b857d]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm font-medium text-[#1f2937]">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[220px]">
              {!editMode && editableFields.length > 0 && (
                <button
                  onClick={handleEdit}
                  className="rounded-2xl bg-[#1d3c34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a564a]"
                >
                  Edit Profile
                </button>
              )}

              {editMode && (
                <>
                  <button
                    onClick={handleSave}
                    className="rounded-2xl bg-[#1d3c34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a564a]"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="rounded-2xl border border-[#cfc4b6] bg-white px-5 py-3 text-sm font-semibold text-[#4b5563] transition hover:bg-[#f8f4ef]"
                  >
                    Cancel
                  </button>
                </>
              )}

              <button
                onClick={handleLogout}
                className="rounded-2xl border border-[#d4c9bb] bg-[#f8f4ef] px-5 py-3 text-sm font-semibold text-[#5b3a1e] transition hover:bg-[#efe6db]"
              >
                Logout
              </button>

              {saveError && (
                <p className="text-sm text-[#b42318]">{saveError}</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {mainSections.map((section) => (
              <div
                key={section.title}
                className="rounded-[28px] border border-[#e2d9cd] bg-white p-6 shadow-[0_18px_40px_-34px_rgba(17,24,39,0.35)]"
              >
                <div className="mb-5 flex flex-col gap-2 border-b border-[#efe7dc] pb-4">
                  <h2 className="text-lg font-semibold text-[#1d2430]">
                    {section.title}
                  </h2>
                  <p className="text-sm text-[#6b7280]">
                    {section.description}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {section.fields.map(renderField)}
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-5 self-start">
            <div className="rounded-[28px] border border-[#e2d9cd] bg-white p-6 shadow-[0_18px_40px_-34px_rgba(17,24,39,0.35)]">
              <div className="border-b border-[#efe7dc] pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b857d]">
                  Account Snapshot
                </p>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-[#f8f4ef] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b857d]">
                    Status
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#1f2937]">
                    {editMode ? "Editing in progress" : "Profile up to date"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f8f4ef] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b857d]">
                    Visible Role
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#1f2937]">
                    {getRoleLabel(currentUser.role)}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f8f4ef] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b857d]">
                    Joined
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#1f2937]">
                    {formatDisplayDate(currentUser.createdAt) || "Not provided"}
                  </p>
                </div>

                <div className="rounded-2xl border border-dashed border-[#d7ccbe] p-4">
                  <p className="text-sm leading-6 text-[#6b7280]">
                    Keep profile details current so internal records, handoffs,
                    and contact information stay accurate.
                  </p>
                </div>
              </div>
            </div>

            {aboutSection && (
              <div className="rounded-[28px] border border-[#e2d9cd] bg-white p-6 shadow-[0_18px_40px_-34px_rgba(17,24,39,0.35)]">
                <div className="mb-5 flex flex-col gap-2 border-b border-[#efe7dc] pb-4">
                  <h2 className="text-lg font-semibold text-[#1d2430]">
                    {aboutSection.title}
                  </h2>
                  <p className="text-sm text-[#6b7280]">
                    {aboutSection.description}
                  </p>
                </div>

                <div className="grid gap-4">
                  {aboutSection.fields.map(renderField)}
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
}

export default ProfilePage;
