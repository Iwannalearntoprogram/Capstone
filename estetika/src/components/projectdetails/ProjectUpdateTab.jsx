import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useOutletContext } from "react-router-dom";

const ProjectUpdateTab = () => {
  const [update, setUpdate] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="project-update-tab" style={{ padding: "2rem" }}>
      <h2>Project Update</h2>
      {message && (
        <div
          style={{
            marginBottom: "1rem",
            color: message.startsWith("Error") ? "red" : "green",
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
    </div>
  );
};

export default ProjectUpdateTab;
