import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/AuthStore";
import axios from "axios";
import Cookies from "js-cookie";
import {
  FaBriefcase,
  FaEdit,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaPhone,
  FaPlus,
  FaUser,
  FaUsers,
  FaUserShield,
  FaUserSlash,
  FaUserTag,
  FaUserTie,
} from "react-icons/fa";
import defaultProfile from "../assets/images/user.png";
import {
  trimValue,
  validateEmail,
  validateRequiredText,
  validateStrongPassword,
  validateUsername,
} from "../utils/validation";

const USERNAME_MAX_LENGTH = 30;
const NAME_MAX_LENGTH = 50;
const PHONE_MAX_LENGTH = 15;

const INITIAL_USER_FORM = {
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phoneNumber: "",
  role: "designer",
};

const getRoleColor = (role) =>
  ({
    admin: "bg-red-100 text-red-800",
    designer: "bg-blue-100 text-blue-800",
    client: "bg-green-100 text-green-800",
    storage_admin: "bg-yellow-100 text-yellow-800",
  }[role] || "bg-gray-100 text-gray-800");

const getRoleLabel = (role) =>
  ({
    admin: "Admin",
    designer: "Designer",
    client: "Client",
    storage_admin: "Storage Admin",
  }[role] || "User");

const userCounts = (users, role) =>
  role === "all"
    ? users.length
    : role === "archived"
    ? users.filter((u) => u.isArchived).length
    : users.filter((u) => u.role === role).length;

const sanitizePhoneInput = (value = "") =>
  String(value).replace(/\D/g, "").slice(0, PHONE_MAX_LENGTH);

const validateUserPhone = (value) => {
  const digitsOnly = sanitizePhoneInput(value);
  if (!digitsOnly) return "Phone number is required.";
  if (digitsOnly.length < 10) {
    return "Phone number must contain at least 10 digits.";
  }
  return "";
};

const validateName = (value, label) =>
  validateRequiredText(value, label, { maxLength: NAME_MAX_LENGTH });

const getPasswordStrength = (value) => {
  if (!value) return null;

  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 3) {
    return { label: "Weak", className: "text-red-500" };
  }
  if (score <= 5) {
    return { label: "Medium", className: "text-amber-500" };
  }
  return { label: "Strong", className: "text-emerald-600" };
};

const formErrors = (data, requirePassword = false) => ({
  username: validateUsername(data.username),
  firstName: validateName(data.firstName, "First name"),
  lastName: validateName(data.lastName, "Last name"),
  email: validateEmail(data.email),
  phoneNumber: validateUserPhone(data.phoneNumber),
  role: trimValue(data.role) ? "" : "Role is required.",
  password: requirePassword ? validateStrongPassword(data.password) : "",
});

const normalizeUser = (data, includePassword = false) => {
  const payload = {
    username: trimValue(data.username),
    firstName: trimValue(data.firstName),
    lastName: trimValue(data.lastName),
    email: trimValue(data.email).toLowerCase(),
    phoneNumber: sanitizePhoneInput(data.phoneNumber),
    role: data.role,
  };
  if (includePassword) payload.password = data.password;
  return payload;
};

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_USER_FORM);
  const [errors, setErrors] = useState({});
  const [editUser, setEditUser] = useState(null);
  const [editData, setEditData] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [editMessage, setEditMessage] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = Cookies.get("token");
      const response = await axios.get(`${serverUrl}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [serverUrl]);

  const filteredUsers = users.filter((user) => {
    if (activeTab === "all") return true;
    if (activeTab === "archived") return user.isArchived;
    return user.role === activeTab && !user.isArchived;
  });

  const tabs = [
    ["all", "All Users", FaUsers],
    ["admin", "Admin", FaUserShield],
    ["designer", "Designer", FaUserTie],
    ["client", "Client", FaUser],
    ["storage_admin", "Storage Admin", FaUserTag],
    ["archived", "Archived", FaUserSlash],
  ];

  const handleField = (setter, errorSetter, requirePassword = false) => (e) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
    errorSetter((prev) => ({
      ...prev,
      [name]: formErrors({ ...(name ? { [name]: value } : {}), ...{} }, requirePassword)[name],
    }));
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditData({
      username: user.username || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phoneNumber: sanitizePhoneInput(user.phoneNumber || ""),
      role: user.role || "designer",
    });
    setEditErrors({});
    setEditMessage("");
  };

  const closeEdit = () => {
    setEditUser(null);
    setEditData(null);
    setEditErrors({});
    setEditMessage("");
  };

  const handleArchive = async (userId, isArchived) => {
    try {
      setLoadingUsers(true);
      const token = Cookies.get("token");
      await axios.put(
        `${serverUrl}/api/user?id=${userId}`,
        { isArchived },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) =>
        prev.map((user) => (user._id === userId ? { ...user, isArchived } : user))
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  const submitCreate = async () => {
    const nextErrors = formErrors(formData, true);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setMessage("Please fix the highlighted fields.");
      return;
    }
    try {
      setIsLoading(true);
      const token = Cookies.get("token");
      await axios.post(
        `${serverUrl}/api/auth/register`,
        normalizeUser(formData, true),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("User created successfully!");
      setFormData(INITIAL_USER_FORM);
      setErrors({});
      await fetchUsers();
      setTimeout(() => {
        setShowModal(false);
        setMessage("");
      }, 1000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to create user.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitEdit = async () => {
    const nextErrors = formErrors(editData || {});
    setEditErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setEditMessage("Please fix the highlighted fields.");
      return;
    }
    try {
      setEditLoading(true);
      const token = Cookies.get("token");
      await axios.put(
        `${serverUrl}/api/user?id=${editUser._id}`,
        normalizeUser(editData),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) =>
        prev.map((user) =>
          user._id === editUser._id ? { ...user, ...normalizeUser(editData) } : user
        )
      );
      setEditMessage("User updated successfully!");
      setTimeout(closeEdit, 1000);
    } catch (error) {
      setEditMessage(error.response?.data?.message || "Failed to update user.");
    } finally {
      setEditLoading(false);
    }
  };

  const actions = (user) => (
    <div className="flex items-center gap-2 self-start sm:self-auto">
      {currentUser?.role === "admin" && user.role === "designer" && (
        <button
          className="rounded-lg border border-[#1D3C34] p-1.5 text-[#1D3C34] transition hover:bg-emerald-50 sm:p-2"
          onClick={() => openEdit(user)}
        >
          <FaEdit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      )}
      <button
        className={`rounded-lg p-1.5 transition hover:bg-yellow-100 sm:p-2 ${
          user.isArchived ? "text-red-600" : "text-gray-400"
        }`}
        onClick={() => handleArchive(user._id, !user.isArchived)}
      >
        <FaUserSlash className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
    </div>
  );

  const field = (label, Icon, name, value, onChange, error, extra = {}) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Icon className="h-4 w-4" style={{ color: "#1D3C34" }} />
        {label}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        {...extra}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div>
      <div className="mx-auto w-full max-w-full sm:max-w-7xl">
        <div className="mb-3 overflow-hidden rounded-2xl bg-white shadow-xl sm:mb-6">
          <div className="bg-[#1D3C34] px-3 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-lg font-bold text-white sm:text-2xl">
                  <FaUser className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
                  Users Management
                </h1>
                <p className="mt-1 text-xs text-emerald-100 sm:text-base">
                  Manage and view all system users
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#1D3C34] sm:w-auto sm:px-4 sm:text-base"
              >
                <FaPlus />
                Add User
              </button>
            </div>
          </div>
        </div>

        <div className="mb-3 overflow-hidden rounded-2xl bg-white shadow-xl sm:mb-6">
          <div className="border-b border-gray-200">
            <nav className="grid grid-cols-1 gap-2 p-2.5 min-[360px]:grid-cols-2 sm:flex sm:space-x-4 sm:overflow-x-auto sm:whitespace-nowrap sm:px-6 sm:py-0">
              {tabs.map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-[13px] font-medium transition sm:gap-2 sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-2 sm:px-1 sm:py-4 sm:text-sm ${
                    activeTab === id
                      ? "border-[#1D3C34] bg-[#1D3C34]/5 text-[#1D3C34]"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span className="truncate text-center">{label}</span>
                  <span className={`rounded-lg px-2 py-0.5 text-[11px] sm:px-2.5 sm:text-xs ${
                    activeTab === id ? "bg-[#1D3C34] text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                    {userCounts(users, id)}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="p-2.5 sm:p-6">
            {loadingUsers ? (
              <div className="py-20 text-center text-gray-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-20 text-center">
                <FaUser className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 text-xl font-semibold text-gray-600">No users found</h3>
                <p className="text-gray-500">
                  {activeTab === "all" ? "Start by adding your first user." : `No ${activeTab} users found.`}
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 md:hidden">
                  {filteredUsers.map((user) => (
                    <div key={user._id} className="rounded-2xl border border-gray-200 bg-white p-2.5 shadow-sm">
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex min-w-0 items-start gap-2.5">
                          <img
                            src={user.profileImage || defaultProfile}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-xl object-cover"
                          />
                            <div className="min-w-0">
                              <div className="break-words text-[15px] font-semibold leading-tight text-gray-900">
                              {user.firstName} {user.lastName}
                              </div>
                              <div className="truncate text-xs text-gray-500">@{user.username}</div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-semibold ${getRoleColor(user.role)}`}>
                                  {getRoleLabel(user.role)}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {user.isArchived ? "Archived user" : "Active user"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0">{actions(user)}</div>
                        </div>

                        <div className="grid gap-2.5 rounded-2xl bg-gray-50 p-2.5 text-sm text-gray-600">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-[#1D3C34] shadow-sm">
                              <FaEnvelope className="h-3 w-3" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Email</div>
                              <div className="mt-0.5 break-all text-[13px] text-gray-800">{user.email}</div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-[#1D3C34] shadow-sm">
                              <FaPhone className="h-3 w-3" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Phone</div>
                              <div className="mt-0.5 text-[13px] text-gray-800">{user.phoneNumber || "Not provided"}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-4 text-left font-semibold text-gray-700">User</th>
                        <th className="px-4 py-4 text-left font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-4 text-left font-semibold text-gray-700">Phone</th>
                        <th className="px-4 py-4 text-left font-semibold text-gray-700">Role</th>
                        <th className="px-4 py-4 text-left font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <img src={user.profileImage || defaultProfile} alt="" className="h-10 w-10 rounded-lg object-cover" />
                              <div>
                                <div className="font-semibold text-gray-900">{user.firstName} {user.lastName}</div>
                                <div className="text-sm text-gray-500">@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-900">{user.email}</td>
                          <td className="px-4 py-4 text-gray-900">{user.phoneNumber}</td>
                          <td className="px-4 py-4">
                            <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${getRoleColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-4 py-4">{actions(user)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {editUser && editData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-[#1D3C34] bg-white shadow-xl">
            <div className="bg-[#1D3C34] px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <h1 className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
                  <FaUserTie className="h-5 w-5 text-emerald-300 sm:h-6 sm:w-6" />
                  Edit Designer
                </h1>
                <button onClick={closeEdit} className="text-2xl leading-none text-white">x</button>
              </div>
            </div>
            <div className="bg-[#f8faf9] p-4 sm:p-8">
              {editMessage && <div className="mb-6 rounded-lg border p-4">{editMessage}</div>}
              <div className="space-y-6">
                {field("Username", FaUserTag, "username", editData.username, (e) => {
                  const value = e.target.value;
                  setEditData((prev) => ({ ...prev, username: value }));
                  setEditErrors((prev) => ({ ...prev, username: validateUsername(value) }));
                }, editErrors.username, { placeholder: "Enter username", maxLength: USERNAME_MAX_LENGTH })}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {field("First Name", FaUser, "firstName", editData.firstName, (e) => {
                    const value = e.target.value;
                    setEditData((prev) => ({ ...prev, firstName: value }));
                    setEditErrors((prev) => ({ ...prev, firstName: validateName(value, "First name") }));
                  }, editErrors.firstName, { placeholder: "Enter first name", maxLength: NAME_MAX_LENGTH })}
                  {field("Last Name", FaUser, "lastName", editData.lastName, (e) => {
                    const value = e.target.value;
                    setEditData((prev) => ({ ...prev, lastName: value }));
                    setEditErrors((prev) => ({ ...prev, lastName: validateName(value, "Last name") }));
                  }, editErrors.lastName, { placeholder: "Enter last name", maxLength: NAME_MAX_LENGTH })}
                </div>
                {field("Email", FaEnvelope, "email", editData.email, (e) => {
                  const value = e.target.value;
                  setEditData((prev) => ({ ...prev, email: value }));
                  setEditErrors((prev) => ({ ...prev, email: validateEmail(value) }));
                }, editErrors.email, { placeholder: "Enter email address", type: "email" })}
                {field("Phone Number", FaPhone, "phoneNumber", editData.phoneNumber, (e) => {
                  const value = sanitizePhoneInput(e.target.value);
                  setEditData((prev) => ({ ...prev, phoneNumber: value }));
                  setEditErrors((prev) => ({ ...prev, phoneNumber: validateUserPhone(value) }));
                }, editErrors.phoneNumber, {
                  placeholder: "Enter phone number",
                  type: "tel",
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  maxLength: PHONE_MAX_LENGTH,
                })}
                {field("Role", FaBriefcase, "role", editData.role, () => {}, "", { readOnly: true })}
              </div>
              <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row">
                <button onClick={submitEdit} disabled={editLoading} className="flex-1 rounded-lg bg-[#21413A] px-6 py-3 font-semibold text-white">
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={closeEdit} className="flex-1 rounded-lg border border-[#1D3C34] bg-gray-100 px-6 py-3 font-semibold text-[#1D3C34] sm:flex-none">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="bg-[#1D3C34] px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <h1 className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
                  <FaUser className="h-5 w-5 sm:h-6 sm:w-6" />
                  Add New User
                </h1>
                <button onClick={() => setShowModal(false)} className="text-2xl leading-none text-white">x</button>
              </div>
            </div>
            <div className="p-4 sm:p-8">
              {message && <div className="mb-6 rounded-lg border p-4">{message}</div>}
              <div className="space-y-6">
                {field("Username", FaUserTag, "username", formData.username, (e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, username: value }));
                  setErrors((prev) => ({ ...prev, username: validateUsername(value) }));
                }, errors.username, { placeholder: "Enter username", maxLength: USERNAME_MAX_LENGTH })}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {field("First Name", FaUser, "firstName", formData.firstName, (e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({ ...prev, firstName: value }));
                    setErrors((prev) => ({ ...prev, firstName: validateName(value, "First name") }));
                  }, errors.firstName, { placeholder: "Enter first name", maxLength: NAME_MAX_LENGTH })}
                  {field("Last Name", FaUser, "lastName", formData.lastName, (e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({ ...prev, lastName: value }));
                    setErrors((prev) => ({ ...prev, lastName: validateName(value, "Last name") }));
                  }, errors.lastName, { placeholder: "Enter last name", maxLength: NAME_MAX_LENGTH })}
                </div>
                {field("Email", FaEnvelope, "email", formData.email, (e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, email: value }));
                  setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
                }, errors.email, { placeholder: "Enter email address", type: "email" })}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaLock className="h-4 w-4" style={{ color: "#1D3C34" }} />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData((prev) => ({ ...prev, password: value }));
                        setErrors((prev) => ({ ...prev, password: validateStrongPassword(value) }));
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-12 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                      placeholder="Enter password"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500" onClick={() => setShowPassword((prev) => !prev)}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                  {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  {passwordStrength && (
                    <p className={`text-sm font-medium ${passwordStrength.className}`}>
                      Password strength: {passwordStrength.label}
                    </p>
                  )}
                </div>
                {field("Phone Number", FaPhone, "phoneNumber", formData.phoneNumber, (e) => {
                  const value = sanitizePhoneInput(e.target.value);
                  setFormData((prev) => ({ ...prev, phoneNumber: value }));
                  setErrors((prev) => ({ ...prev, phoneNumber: validateUserPhone(value) }));
                }, errors.phoneNumber, {
                  placeholder: "Enter phone number",
                  type: "tel",
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  maxLength: PHONE_MAX_LENGTH,
                })}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaBriefcase className="h-4 w-4" style={{ color: "#1D3C34" }} />
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                  >
                    <option value="admin">Admin</option>
                    <option value="designer">Designer</option>
                    <option value="client">Client</option>
                    <option value="storage_admin">Storage Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row">
                <button onClick={submitCreate} disabled={isLoading} className="flex-1 rounded-lg bg-gradient-to-r from-[#1D3C34] to-[#145c4b] px-6 py-3 font-semibold text-white">
                  {isLoading ? "Creating User..." : "Create User"}
                </button>
                <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg bg-gray-100 px-6 py-3 font-semibold text-gray-700 sm:flex-none">
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
