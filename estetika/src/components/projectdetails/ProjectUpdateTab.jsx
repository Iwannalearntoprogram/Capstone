import React from "react";

const ProjectUpdateTab = () => {
  return (
    <div className="project-update-tab" style={{ padding: "2rem" }}>
      <h2>Project Updates</h2>
      <div style={{ margin: "1.5rem 0" }}>
        <form>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="update"
              style={{ display: "block", marginBottom: ".5rem" }}
            >
              New Update
            </label>
            <textarea
              id="update"
              name="update"
              rows={4}
              style={{
                width: "100%",
                padding: ".5rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
              placeholder="Write your project update here..."
            />
          </div>
          <button
            type="submit"
            style={{
              background: "#1976d2",
              color: "#fff",
              border: "none",
              padding: ".75rem 1.5rem",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Post Update
          </button>
        </form>
      </div>
      <div>
        <h3>Previous Updates</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li
            style={{
              background: "#f5f5f5",
              margin: "1rem 0",
              padding: "1rem",
              borderRadius: "4px",
            }}
          >
            <strong>May 28, 2025:</strong> Project kickoff meeting completed.
          </li>
          <li
            style={{
              background: "#f5f5f5",
              margin: "1rem 0",
              padding: "1rem",
              borderRadius: "4px",
            }}
          >
            <strong>May 29, 2025:</strong> Initial design phase started.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ProjectUpdateTab;
