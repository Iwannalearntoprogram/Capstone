import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useOutletContext } from "react-router-dom";
import Modal from "react-modal";
import {
  FiClock,
  FiImage,
  FiInfo,
  FiMessageSquare,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import ProfileImage from "../common/ProfileImage";
import {
  trimValue,
  validateFile,
  validateRequiredText,
} from "../../utils/validation";

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "No activity yet";

const ProjectUpdateTab = () => {
  const [update, setUpdate] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [newUpdate, setNewUpdate] = useState({
    description: "",
    imageLink: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [updateErrors, setUpdateErrors] = useState({});
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const { project } = useOutletContext();

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
  }, []);

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  useEffect(() => {
    const fetchUpdate = async () => {
      if (!project?._id) return;
      setLoading(true);
      setMessage("");
      try {
        const token = Cookies.get("token");
        const res = await axios.get(
          `${serverUrl}/api/project/update?projectId=${project._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUpdate(res.data.update);
        setMessage("");
      } catch (err) {
        setMessage("Error fetching update.");
        setUpdate(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdate();
  }, [project?._id, serverUrl]);

  const handleAddUpdateClick = () => {
    if (userRole === "admin") {
      alert(
        "Admins cannot create updates. Only designers can manage project updates."
      );
      return;
    }
    setModalOpen(true);
  };

  const handleAddUpdate = async () => {
    if (userRole === "admin") {
      alert(
        "Admins cannot create updates. Only designers can manage project updates."
      );
      return;
    }

    const nextErrors = {
      description: validateRequiredText(newUpdate.description, "Description"),
      image: selectedImage
        ? validateFile(selectedImage, {
            label: "Image",
            allowedMimePrefixes: ["image/"],
            maxSizeMb: 10,
          })
        : "",
    };
    setUpdateErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setMessage("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      const token = Cookies.get("token");
      const currentUser = Cookies.get("user");
      let designerId = undefined;
      try {
        designerId = currentUser ? JSON.parse(currentUser).id : undefined;
      } catch {
        designerId = undefined;
      }

      let imageLink = null;

      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        const uploadRes = await axios.post(
          `${serverUrl}/api/upload/project/update?projectId=${project._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        imageLink = uploadRes.data.imageLink;
      }

      const body = {
        description: trimValue(newUpdate.description),
        imageLink,
        projectId: project._id,
        clientId: project.projectCreator._id,
        designerId,
      };

      await axios.post(`${serverUrl}/api/project/update`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setClosing(true);
      setTimeout(() => {
        setModalOpen(false);
        setClosing(false);
        setNewUpdate({ description: "", imageLink: "" });
        setSelectedImage(null);
        setUpdateErrors({});
      }, 300);
      setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      setMessage("Failed to add update.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUpdate = async (id) => {
    if (userRole === "admin") {
      alert(
        "Admins cannot delete updates. Only designers can manage project updates."
      );
      return;
    }

    if (!window.confirm("Are you sure you want to delete this update?")) return;
    setLoading(true);
    try {
      const token = Cookies.get("token");
      await axios.delete(`${serverUrl}/api/project/update?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage("Update deleted successfully.");
      setUpdate((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setMessage("Failed to delete update.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setClosing(true);
    setTimeout(() => {
      setModalOpen(false);
      setClosing(false);
      setNewUpdate({ description: "", imageLink: "" });
      setSelectedImage(null);
      setUpdateErrors({});
    }, 300);
  };

  const isAdmin = userRole === "admin";
  const updates = useMemo(
    () =>
      Array.isArray(update)
        ? [...update].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        : [],
    [update]
  );
  const latestUpdate = updates[0];
  const updatesWithImages = updates.filter(
    (item) => item.imageLink && item.imageLink.trim() !== ""
  ).length;
  const stats = [
    {
      label: "Entries",
      value: updates.length,
      helper: updates.length === 1 ? "Project update" : "Project updates",
      icon: <FiMessageSquare size={16} />,
    },
    {
      label: "Media",
      value: updatesWithImages,
      helper: updatesWithImages === 1 ? "With image" : "With images",
      icon: <FiImage size={16} />,
    },
    {
      label: "Latest",
      value: latestUpdate ? formatDateTime(latestUpdate.createdAt) : "No activity yet",
      helper: latestUpdate?.designerId?.fullName || "Waiting for first update",
      icon: <FiClock size={16} />,
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-[18px] border border-black/5 bg-[#fcfbf8] p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.35)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Updates
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-900">
              Project updates
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-500">
              Share milestones, decisions, and progress snapshots in one clean feed.
            </p>
          </div>

          {!isAdmin ? (
            <button
              onClick={handleAddUpdateClick}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1D3C34] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#163029]"
              type="button"
            >
              <FiPlus size={16} />
              Add Update
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-[16px] border border-[#e3ddd3] bg-white px-4 py-4"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <span className="text-[#1d3c34]">{item.icon}</span>
                {item.label}
              </div>
              <p className="mt-3 text-lg font-semibold text-slate-900">{item.value}</p>
              <p className="mt-1 text-sm text-slate-500">{item.helper}</p>
            </div>
          ))}
        </div>
      </section>

      {isAdmin ? (
        <div className="flex items-start gap-3 rounded-[16px] border border-[#d8deda] bg-white px-4 py-4 text-slate-600">
          <div className="mt-0.5 text-[#1d3c34]">
            <FiInfo size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">View only mode</p>
            <p className="mt-1 text-sm">
              Only designers can create and manage project updates.
            </p>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-[14px] border border-[#d8deda] bg-white px-4 py-3 text-sm text-slate-600">
          {message}
        </div>
      ) : null}

      {updates.length > 0 ? (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
          {updates.map((item) => (
            <article
              key={item._id}
              className="rounded-[18px] border border-[#e3ddd3] bg-white p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.28)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="h-12 w-12 overflow-hidden rounded-[14px] border border-[#d8deda] bg-[#f5f7f6]">
                    <ProfileImage
                      src={item.designerId?.profileImage}
                      alt={item.designerId?.fullName || "Designer"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-slate-900">
                      {item.designerId?.fullName || "Designer"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>

                {!isAdmin ? (
                  <button
                    onClick={() => handleDeleteUpdate(item._id)}
                    className="inline-flex items-center justify-center rounded-lg border border-black/5 p-2 text-slate-400 transition hover:border-red-200 hover:text-red-600"
                    title="Delete update"
                    disabled={loading}
                    type="button"
                  >
                    <FiTrash2 size={16} />
                  </button>
                ) : null}
              </div>

              <div className="mt-5 text-base leading-8 text-slate-700 whitespace-pre-line">
                {item.description}
              </div>

              {item.imageLink && item.imageLink.trim() !== "" ? (
                <div className="mt-5 overflow-hidden rounded-[16px] border border-[#d8deda] bg-[#f8faf9]">
                  <img
                    src={item.imageLink}
                    alt="Update"
                    className="max-h-[420px] w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-black/5 pt-4 text-sm text-slate-500">
                <span className="rounded-lg bg-[#f5f7f6] px-3 py-1.5">
                  Client: {item.clientId?.fullName || "Not assigned"}
                </span>
                {item.imageLink ? (
                  <span className="rounded-lg bg-[#f5f7f6] px-3 py-1.5">
                    With image
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] border border-dashed border-[#d8deda] bg-white px-6 py-12 text-center text-slate-500">
          <p className="text-base font-medium text-slate-700">No updates yet</p>
          <p className="mt-2 text-sm">
            {isAdmin
              ? "Only designers can create project updates."
              : "Use the add update action to share the first progress note."}
          </p>
        </div>
      )}

      {modalOpen && !isAdmin ? (
        <div
          className={`fixed left-0 top-0 z-50 h-full w-full bg-black/20 ${
            closing ? "opacity-0 transition-opacity duration-300" : "opacity-100"
          }`}
          onClick={closeModal}
        />
      ) : null}

      <Modal
        isOpen={modalOpen || closing}
        onRequestClose={closeModal}
        className={`fixed left-1/2 top-1/2 z-50 w-[92%] max-w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-black/5 bg-[#fcfbf8] shadow-[0_40px_120px_-45px_rgba(15,23,42,0.55)] ${
          closing
            ? "scale-95 opacity-0 transition-all duration-300"
            : "scale-100 opacity-100"
        }`}
        overlayClassName="fixed left-0 top-0 z-50 h-full w-full bg-black/40 backdrop-blur-[2px]"
        shouldCloseOnOverlayClick={false}
        ariaHideApp={false}
      >
        <div className="border-b border-black/5 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Updates
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
            Add project update
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Share the latest progress, key notes, and optional visual proof.
          </p>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Description
            </label>
            <textarea
              placeholder="Describe the progress, changes, or updates you've made..."
              value={newUpdate.description}
              onChange={(e) => {
                setNewUpdate({ ...newUpdate, description: e.target.value });
                setUpdateErrors((prev) => ({
                  ...prev,
                  description: validateRequiredText(
                    e.target.value,
                    "Description"
                  ),
                }));
              }}
              className="min-h-[140px] w-full resize-none rounded-xl border border-[#d8deda] bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#1d3c34] focus:ring-2 focus:ring-[#1d3c34]/10"
              rows={5}
            />
            {updateErrors.description ? (
              <p className="text-sm text-red-600">{updateErrors.description}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const fileError = validateFile(file, {
                    label: "Image",
                    allowedMimePrefixes: ["image/"],
                    maxSizeMb: 10,
                  });
                  setSelectedImage(fileError ? null : file);
                  setUpdateErrors((prev) => ({
                    ...prev,
                    image: fileError,
                  }));
                }
              }}
              className="hidden"
              id="update-image-input"
            />
            <label
              htmlFor="update-image-input"
              className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-[#c9d7d1] bg-white px-4 py-4 transition hover:border-[#1d3c34]/40"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#f5f7f6] p-2 text-[#1d3c34]">
                  <FiImage size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedImage ? selectedImage.name : "Upload an image"}
                  </p>
                  <p className="text-xs text-slate-500">PNG, JPG, JPEG up to 10MB</p>
                </div>
              </div>
              <span className="rounded-lg bg-[#f5f7f6] px-3 py-2 text-xs font-medium text-slate-600">
                Browse
              </span>
            </label>
            {updateErrors.image ? (
              <p className="text-sm text-red-600">{updateErrors.image}</p>
            ) : null}

            {previewUrl ? (
              <div className="overflow-hidden rounded-[16px] border border-[#d8deda] bg-white">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-56 w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-black/5 px-6 py-5">
          <button
            onClick={closeModal}
            className="rounded-xl border border-black/5 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            disabled={loading}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleAddUpdate}
            className="inline-flex min-w-[132px] items-center justify-center rounded-xl bg-[#1D3C34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#163029] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
            type="button"
          >
            {loading ? "Adding..." : "Add Update"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectUpdateTab;
