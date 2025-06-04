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
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 w-[90%] max-w-[400px] rounded-lg shadow-lg z-50 ${
          closing ? "opacity-0 transition-opacity duration-300" : "opacity-100"
        }`}
        overlayClassName="fixed top-0 left-0 w-full h-full bg-black/20 z-50 backdrop-blur-xs"
        shouldCloseOnOverlayClick={false}
        ariaHideApp={false}
      >
        <h2 className="text-lg font-semibold mb-4 text-center">
          Add Project Update
        </h2>
        <label className="block mb-2">Description:</label>
        <textarea
          placeholder="Update Description"
          value={newUpdate.description}
          onChange={(e) =>
            setNewUpdate({ ...newUpdate, description: e.target.value })
          }
          className="w-full p-2 mb-4 border resize-none border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />
        <label className="block mb-2">Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setSelectedImage(e.target.files[0]);
            }
          }}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={handleAddUpdate}
            className="px-4 py-2 bg-[#1D3C34] text-white rounded-md hover:bg-[#145c4b] transition flex items-center justify-center min-w-[100px]"
            disabled={loading}
          >
            {loading ? (
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
            ) : null}
            {loading ? "Adding..." : "Add Update"}
          </button>
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectUpdateTab;
