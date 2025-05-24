import { useState } from "react";
// import '../styles/AdminProjects.css'; // Add this for modal styling
import { Link } from "react-router-dom";

function AdminProjectsPage() {
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "Website Redesign",
      description: "Update UI/UX for landing page",
      deadline: "2024-06-30",
      assignedTo: "Alice",
    },
    {
      id: 2,
      name: "Marketing Banner",
      description: "Design banner for summer promo",
      deadline: "2024-07-10",
      assignedTo: "Bob",
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    deadline: "",
    assignedTo: "",
  });

  const handleAssign = () => {
    if (!newProject.name || !newProject.assignedTo) return;

    const id = projects.length + 1;
    const project = { id, ...newProject };
    setProjects([...projects, project]);

    // reset
    setNewProject({ name: "", description: "", deadline: "", assignedTo: "" });
    setShowModal(false);
  };

  return (
    <div className="admin-projects-page">
      <h2>Admin Projects</h2>
      <button onClick={() => setShowModal(true)}>Assign New Project</button>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Assign New Project</h3>
            <input
              type="text"
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) =>
                setNewProject({ ...newProject, name: e.target.value })
              }
            />
            <textarea
              placeholder="Project Description"
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
            />
            <input
              type="date"
              value={newProject.deadline}
              onChange={(e) =>
                setNewProject({ ...newProject, deadline: e.target.value })
              }
            />
            <select
              value={newProject.assignedTo}
              onChange={(e) =>
                setNewProject({ ...newProject, assignedTo: e.target.value })
              }
            >
              <option value="">Select Designer</option>
              <option value="Alice">Alice</option>
              <option value="Bob">Bob</option>
            </select>
            <div className="modal-buttons">
              <button onClick={handleAssign}>Assign</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="project-list">
        {projects.map((project) => (
          <div key={project.id} className="card">
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <p>Deadline: {project.deadline}</p>
            <p>Assigned to: {project.assignedTo}</p>
            <Link to={`/projects/${project.id}`}>
              <button>View Details</button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminProjectsPage;
