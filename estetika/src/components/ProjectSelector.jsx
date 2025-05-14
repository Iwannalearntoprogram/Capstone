import React, { useContext } from 'react';
import { BudgetContext } from '../context/BudgetContext';

const ProjectSelector = () => {
  const { projects, activeProject, setActiveProject } = useContext(BudgetContext);
  
  const handleProjectChange = (e) => {
    setActiveProject(e.target.value);
  };

  return (
    <div className="project-selector">
      <select 
        value={activeProject || ''} 
        onChange={handleProjectChange}
        disabled={projects.length === 0}
      >
        {projects.length === 0 ? (
          <option value="">No projects available</option>
        ) : (
          <>
            <option value="">Select a project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name} (${project.budget.toLocaleString()})
              </option>
            ))}
          </>
        )}
      </select>
      
      {projects.length === 0 && (
        <p>Please create a project to get started.</p>
      )}
    </div>
  );
};

export default ProjectSelector;