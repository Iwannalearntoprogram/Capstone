import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useOutletContext } from "react-router-dom";
import Modal from "react-modal";
import { FaTrash, FaInfoCircle } from "react-icons/fa";

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
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  const { project } = useOutletContext();

  // Get user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
  }, []);

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
        setMessage(res.data.message || "Update fetched!");
      } catch (err) {
        setMessage("Error fetching update.");
        setUpdate(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdate();
  }, [project?._id]);

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
    // Prevent admin from creating updates
    if (userRole === "admin") {
      alert(
        "Admins cannot create updates. Only designers can manage project updates."
      );
      return;
    }

    if (!newUpdate.description) {
      setMessage("Description is required.");
      return;
    }
    if (!selectedImage) {
      setMessage("Image is required.");
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

      // 1. Upload image to server
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
      const imageLink = uploadRes.data.imageLink;

      // 2. Post update with imageLink
      const body = {
        description: newUpdate.description,
        imageLink: imageLink,
        projectId: project._id,
        clientId: project.projectCreator._id,
        designerId: designerId,
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
      }, 300);
      // Optionally, refetch updates here
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
      setUpdate((prev) => prev.filter((u) => u._id !== id));
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
    }, 300);
  };

  const isAdmin = userRole === "admin";

  return (
    <div className="project-update-tab flex flex-col items-center min-h-[60vh] px-4">
      {/* Add Update button - Only show if not admin */}
      {!isAdmin && (
        <button
          onClick={handleAddUpdateClick}
          className="bg-[#145c4b] px-6 py-3 rounded-lg shadow-sm cursor-pointer flex items-center justify-center text-white font-medium transition mb-6"
          type="button"
        >
          + Add Update
        </button>
      )}

      {/* Show admin message if admin */}
      {isAdmin && (
        <div className="flex items-center gap-2 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-xl w-full">
          <FaInfoCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-800">
            View only mode - Only designers can create and manage project
            updates
          </span>
        </div>
      )}

      {Array.isArray(update) && update.length > 0 ? (
        <div className="w-full max-w-xl flex flex-col gap-6">
          {[...update].reverse().map((u) => (
            <div
              key={u._id}
              className="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Designer avatar */}
                  <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center">
                    {u.designerId?.profileImage ? (
                      <div className="w-full h-full object-cover"></div>
                    ) : (
                      <span className="text-gray-400 text-xl">
                        {u.designerId?.fullName?.[0] || "?"}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      {u.designerId?.fullName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                {/* Only show delete button if not admin */}
                {!isAdmin && (
                  <button
                    onClick={() => handleDeleteUpdate(u._id)}
                    className="text-gray-400 hover:text-red-500 transition"
                    title="Delete update"
                    disabled={loading}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
              <div className="mt-2 text-gray-800 text-base whitespace-pre-line">
                {u.description}
              </div>
              {u.imageLink && u.imageLink.trim() !== "" && (
                <div className="flex justify-center mt-2">
                  <img
                    src={u.imageLink}
                    alt="Update"
                    className="max-w-full max-h-72 rounded-lg border"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                <span>
                  <span className="font-medium">Client:</span>{" "}
                  {u.clientId?.fullName}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 mt-8 text-center text-lg">
          {isAdmin ? (
            <>
              <p>No updates yet.</p>
              <p className="text-sm mt-2">
                Only designers can create project updates
              </p>
            </>
          ) : (
            "No update yet."
          )}
        </div>
      )}

      {/* Modal for Add Update - Only show if not admin */}
      {modalOpen && !isAdmin && (
        <div
          className={`fixed top-0 left-0 w-full h-full bg-black/20 z-50 ${
            closing
              ? "opacity-0 transition-opacity duration-300"
              : "opacity-100"
          }`}
          onClick={closeModal}
        />
      )}
      <Modal
        isOpen={modalOpen || closing}
        onRequestClose={closeModal}
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white w-[90%] max-w-[500px] rounded-2xl shadow-2xl z-50 overflow-hidden ${
          closing
            ? "opacity-0 scale-95 transition-all duration-300"
            : "opacity-100 scale-100"
        }`}
        overlayClassName="fixed top-0 left-0 w-full h-full bg-black/50 z-50 backdrop-blur-sm"
        shouldCloseOnOverlayClick={false}
        ariaHideApp={false}
      >
        {/* Header */}
        <div className="bg-[#1D3C34] px-6 py-4">
          <h2 className="text-xl font-bold text-white text-center">
            Add Project Update
          </h2>
          <p className="text-center text-green-100 text-sm mt-1">
            Share progress with your client
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Describe the progress, changes, or updates you've made..."
              value={newUpdate.description}
              onChange={(e) =>
                setNewUpdate({ ...newUpdate, description: e.target.value })
              }
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3C34] focus:border-[#1D3C34] resize-none transition-all bg-white"
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              Image <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedImage(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="update-image-input"
              />
              <label
                htmlFor="update-image-input"
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-[#1D3C34] hover:bg-[#f8fffe] transition-all cursor-pointer flex flex-col items-center gap-2"
              >
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {selectedImage
                      ? selectedImage.name
                      : "Click to upload an image"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, JPEG up to 10MB
                  </p>
                </div>
              </label>
            </div>

            {/* Image Preview */}
            {selectedImage && (
              <div className="mt-3 relative">
                <div className="rounded-lg overflow-hidden border-2 border-[#1D3C34] bg-white shadow-sm">
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="absolute top-2 left-2 bg-[#1D3C34] text-white text-xs px-2 py-1 rounded-full font-medium">
                  Preview
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-6 pt-2 border-t border-gray-200">
          <button
            onClick={closeModal}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleAddUpdate}
            className="px-6 py-3 bg-[#1D3C34] text-white rounded-lg hover:bg-[#145c4b] transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
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
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Adding...
              </>
            ) : (
              "Add Update"
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectUpdateTab;
