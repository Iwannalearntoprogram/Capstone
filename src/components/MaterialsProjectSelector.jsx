import React, { useState, useEffect } from 'react';
import { Form, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const MaterialsProjectSelector = ({ onProjectSelect, initialValue = '' }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(initialValue);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/projects');
        setProjects(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load projects');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleSelect = (projectId) => {
    setSelectedProject(projectId);
    onProjectSelect(projectId);
  };

  if (loading) return <Spinner animation="border" size="sm" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Form.Group className="mb-3">
      <Form.Label>Select Project</Form.Label>
      <Form.Select
        value={selectedProject}
        onChange={(e) => handleSelect(e.target.value)}
        disabled={projects.length === 0}
      >
        <option value="">-- No Project Selected --</option>
        {projects.map((project) => (
          <option key={project._id} value={project._id}>
            {project.name} ({project.client || 'No client'})
          </option>
        ))}
      </Form.Select>
      {projects.length === 0 && (
        <Form.Text className="text-muted">
          No projects available. Create a project first.
        </Form.Text>
      )}
    </Form.Group>
  );
};

export default MaterialsProjectSelector;