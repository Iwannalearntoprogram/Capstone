import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useOutletContext } from "react-router-dom";
import Modal from "react-modal";

const ProjectUpdateTab = () => {
  const [update, setUpdate] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [newUpdate, setNewUpdate] = useState({
    description: "",
    imageLink: "",
  });

  const { project } = useOutletContext();

  useEffect(() => {
    const fetchUpdate = async () => {
      if (!project?._id) return;
      setLoading(true);
      setMessage("");
      try {
        const token = Cookies.get("token");
        const res = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/project/update?id=${
            project._id
          }`,
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

  const handleAddUpdate = async () => {
    if (!newUpdate.description) {
      setMessage("Description is required.");
      return;
    }
    setLoading(true);
    try {
      const token = Cookies.get("token");
      // Get current user from cookie
      const currentUser = Cookies.get("user");
      let designerId = undefined;
      try {
        designerId = currentUser ? JSON.parse(currentUser)._id : undefined;
      } catch {
        designerId = undefined;
      }
      // Find client member
      const clientMember = Array.isArray(project.members)
        ? project.members.find((m) => m.role === "client")
        : null;
      const clientId = clientMember?._id;

      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/project/update`,
        {
          description: newUpdate.description,
          imageLink: newUpdate.imageLink,
          projectId: project._id,
          clientId: clientId,
          designerId: designerId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage("Update added successfully!");
      setClosing(true);
      setTimeout(() => {
        setModalOpen(false);
        setClosing(false);
        setNewUpdate({ description: "", imageLink: "" });
      }, 300);
      setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      setMessage("Failed to add update.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setClosing(true);
    setTimeout(() => {
      setModalOpen(false);
      setClosing(false);
    }, 300);
  };

  return (
    <div className="project-update-tab" style={{ padding: "2rem" }}>
      <h2>Project Update</h2>
      <button
        onClick={() => setModalOpen(true)}
        className="border-[1px] border-dashed border-[#145c4b] p-4 py-2 rounded-lg shadow-sm bg-white hover:bg-gray-50 cursor-pointer flex items-center justify-center text-gray-500 font-medium transition mb-4"
        type="button"
      >
        + Add Update
      </button>
      {message && (
        <div
          style={{
            marginBottom: "1rem",
            color:
              message.startsWith("Error") || message.startsWith("Failed")
                ? "red"
                : "green",
          }}
        >
          {message}
        </div>
      )}
      {update ? (
        <div
          style={{
            background: "#f5f5f5",
            padding: "1rem",
            borderRadius: "4px",
          }}
        >
          <h3>Description:</h3>
          <p>{update.description}</p>
          {update.imageLink && (
            <div>
              <h4>Image:</h4>
              <img
                src={update.imageLink}
                alt="Update"
                style={{ maxWidth: "300px" }}
              />
            </div>
          )}
          <h4>Project Title:</h4>
          <p>{update.projectId?.title}</p>
          <h4>Client:</h4>
          <p>{update.clientId?.fullName}</p>
          <h4>Designer:</h4>
          <p>{update.designerId?.fullName}</p>
          <h4>Created At:</h4>
          <p>{new Date(update.createdAt).toLocaleString()}</p>
        </div>
      ) : (
        <div style={{ color: "#888", marginTop: "1rem" }}>No update yet.</div>
      )}

      {/* Modal for Add Update */}
      {modalOpen && (
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
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 w-[90%] max-w-[400px] rounded-lg shadow-lg z-50 ${
          closing ? "opacity-0 transition-opacity duration-300" : "opacity-100"
        }`}
        overlayClassName="fixed top-0 left-0 w-full h-full bg-black/20 z-50 backdrop-blur-xs"
        shouldCloseOnOverlayClick={false}
        ariaHideApp={false}
      >
        <h2 className="text-lg font-semibold mb-4">Add Project Update</h2>
        <label className="block mb-2">Description:</label>
        <textarea
          placeholder="Update Description"
          value={newUpdate.description}
          onChange={(e) =>
            setNewUpdate({ ...newUpdate, description: e.target.value })
          }
          className="w-full p-2 mb-4 border resize-none border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />
        <label className="block mb-2">Image Link:</label>
        <input
          type="text"
          placeholder="Image URL"
          value={newUpdate.imageLink}
          onChange={(e) =>
            setNewUpdate({ ...newUpdate, imageLink: e.target.value })
          }
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={handleAddUpdate}
            className="px-4 py-2 bg-[#1D3C34] text-white rounded-md hover:bg-[#145c4b] transition"
            disabled={loading}
          >
            Add Update
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
