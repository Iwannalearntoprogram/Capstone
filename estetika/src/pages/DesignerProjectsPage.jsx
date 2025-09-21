import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function DesignerProjectsPage() {
  const [projects, setProjects] = useState([]);
  const userId = 1; // Hardcoded userId for now
  const navigate = useNavigate();

  // Mock projects data for now (simulating fetching)
  const mockProjects = [
    {
      id: 1,
      name: "Project A",
      description: "Design project A",
      assignedTo: 1,
    },
    {
      id: 2,
      name: "Project B",
      description: "Design project B",
      assignedTo: 1,
    },
    {
      id: 3,
      name: "Project C",
      description: "Design project C",
      assignedTo: 2,
    }, // Not assigned to current designer
  ];

  useEffect(() => {
    // In a real app, fetch data here
    const designerProjects = mockProjects.filter(
      (project) => project.assignedTo === userId
    );
    setProjects(designerProjects);
  }, [userId]);

  return (
    <div>
      <h1>Your Projects</h1>
      <div>
        {projects.length === 0 ? (
          <p>No projects assigned.</p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/dashboard/projects/${project.id}`)}
              style={{ cursor: "pointer" }}
            >
              <h3>{project.name}</h3>
              <p>{project.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DesignerProjectsPage;
