import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const ProjectDetailsModal = ({ project, onClose }) => {
  // Print the project object for debugging
  useEffect(() => {
    console.log("Project details:", project);
  }, [project]);

  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [status, setStatus] = useState(project.status);
  const [designers, setDesigners] = useState([]);
  const [selectedDesigner, setSelectedDesigner] = useState("");

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    if (status === "ongoing") {
      const fetchDesigners = async () => {
        try {
          const token = Cookies.get("token");
          const res = await axios.get(`${serverUrl}/api/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const designerList = res.data.filter((u) => u.role === "designer");
          setDesigners(designerList);
        } catch (err) {
          setDesigners([]);
        }
      };
      fetchDesigners();
    }
  }, [status, serverUrl]);

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    setActionMessage("");
    try {
      const token = Cookies.get("token");
      await axios.put(
        `${serverUrl}/api/project?id=${project._id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setStatus(newStatus);
      setActionMessage(
        newStatus === "ongoing"
          ? "Project approved and set to ongoing."
          : "Project declined and set to cancelled."
      );
      setTimeout(() => {
        setActionMessage("");
        if (newStatus === "cancelled") {
          onClose();
          window.location.reload();
        }
      }, 1200);
    } catch (err) {
      setActionMessage("Failed to update project status.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDesigner = async (e) => {
    e.preventDefault();
    if (!selectedDesigner) return;
    setLoading(true);
    setActionMessage("");
    try {
      const token = Cookies.get("token");
      const prevMembers = Array.isArray(project.members)
        ? project.members.map((m) => (typeof m === "string" ? m : m._id))
        : [];
      const updatedMembers = prevMembers.includes(selectedDesigner)
        ? prevMembers
        : [...prevMembers, selectedDesigner];

      const res = await axios.put(
        `${serverUrl}/api/project?id=${project._id}`,
        { members: updatedMembers },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log({ members: updatedMembers });
      console.log(res.data);
      setActionMessage("Designer assigned successfully.");
      // setTimeout(() => {
      //   setActionMessage("");
      //   onClose();
      //   window.location.reload();
      // }, 1200);
    } catch (err) {
      setActionMessage("Failed to assign designer.");
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  if (status === "ongoing") {
    const currentDesigners =
      Array.isArray(project.members) && project.members.length > 0
        ? project.members.filter((member) => member.role === "designer")
        : [];

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
          <button
            className="absolute top-2 right-4 text-gray-500 text-2xl"
            onClick={onClose}
          >
            &times;
          </button>
          <h2 className="text-2xl font-bold mb-4 text-center">Add Designer</h2>
          {currentDesigners.length > 0 ? (
            <div className="mb-4 text-center">
              <span className="font-semibold">
                Current Designer{currentDesigners.length > 1 ? "s" : ""}:{" "}
              </span>
              {currentDesigners.map((designer, idx) => (
                <span
                  key={designer._id || idx}
                  className="text-[#1D3C34] font-medium"
                >
                  {designer.fullName || designer.username || designer.email}
                  {idx < currentDesigners.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          ) : (
            <div className="mb-4 text-center text-gray-400">
              No designer assigned yet.
            </div>
          )}
          <form onSubmit={handleAssignDesigner}>
            <label className="block mb-2 font-medium">Select Designer:</label>
            <select
              className="w-full p-2 mb-4 border border-gray-300 rounded focus:outline-none"
              value={selectedDesigner}
              onChange={(e) => setSelectedDesigner(e.target.value)}
              required
            >
              <option value="">-- Select Designer --</option>
              {designers
                .filter(
                  (designer) =>
                    !currentDesigners.some(
                      (d) =>
                        d._id === designer._id ||
                        d.username === designer.username
                    )
                )
                .map((designer) => (
                  <option key={designer._id} value={designer._id}>
                    {designer.username}
                  </option>
                ))}
            </select>
            <div className="flex justify-center mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-[#1D3C34] text-white rounded hover:bg-[#145c4b] transition"
                disabled={loading}
              >
                {loading
                  ? "Assigning..."
                  : currentDesigners.length > 0
                  ? "Add Designer"
                  : "Assign Designer"}
              </button>
            </div>
            {actionMessage && (
              <div className="mt-4 text-center text-sm text-green-700">
                {actionMessage}
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Default: show project info and approve/decline
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
        <button
          className="absolute top-2 right-4 text-gray-500 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">{project.title}</h2>
        <div className="mb-2">
          <span className="font-semibold">Description: </span>
          {project.description}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Budget: </span>
          {project.budget}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Start Date: </span>
          {project.startDate}
        </div>
        <div className="mb-2">
          <span className="font-semibold">End Date: </span>
          {project.endDate}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Project Location: </span>
          {project.projectLocation}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Project Size (sq ft): </span>
          {project.projectSize}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Room Type: </span>
          {project.roomType}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Status: </span>
          {status}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 bg-[#1D3C34] text-white rounded transition"
            onClick={() => handleStatusChange("ongoing")}
            disabled={loading}
          >
            {loading ? "Processing..." : "Approve"}
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            onClick={() => handleStatusChange("cancelled")}
            disabled={loading}
          >
            {loading ? "Processing..." : "Decline"}
          </button>
        </div>
        {actionMessage && (
          <div className="mt-4 text-center text-sm text-green-700">
            {actionMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
