// import React from 'react';
// import { Outlet, useParams } from 'react-router-dom';
// import SubNavbarProjects from '../components/SubNavbarProjects'; // You can reuse or customize this

// const ProjectDetailsPage = () => {
//   const { projectId } = useParams();

//   return (
//     <div>
//       <SubNavbarProjects projectId={projectId} />
//       <h2>Project #{projectId} Details</h2>

//       {/* Show the selected section (Tasks, Progress, etc.) here */}
//       <Outlet />
//     </div>
//   );
// };

// export default ProjectDetailsPage;
// import React from 'react';
// import { useParams } from 'react-router-dom';
// import SubNavbarProjects from '../components/SubNavbarProjects';

// const ProjectDetailPage = () => {
//   const { id } = useParams();

//   return (
//     <div>
//       <SubNavbarProjects />
//       <h1>Project #{id} Details</h1>
//       {/* Based on active tab in SubNavbarProjects, render the correct section here */}
//     </div>
//   );
// };

// export default ProjectDetailPage;
import { useParams, Link, Outlet } from 'react-router-dom'; // `Link` to navigate, `Outlet` for nested content

function ProjectDetailsPage() {
  const { projectId } = useParams();  // Get projectId from URL

  // Example static project data (you can later replace this with real API calls)
  const project = {
    1: { name: 'Project A', description: 'Detailed description of Project A' },
    2: { name: 'Project B', description: 'Detailed description of Project B' },
  };

  const selectedProject = project[projectId];

  return (
    <div>
      <h1>{selectedProject?.name}</h1>
      <p>{selectedProject?.description}</p>

      {/* Sub-navbar (Tabs) */}
      <div className="tabs">
        <ul>
        
          <li>
            <Link to={`/projects/${projectId}/tasks`} className="tab-link">
              Tasks
            </Link>
          </li>
          <li>
            <Link to={`/projects/${projectId}/progress`} className="tab-link">
              Progress
            </Link>
          </li>
          <li>
            <Link to={`/projects/${projectId}/files`} className="tab-link">
              Files
            </Link>
          </li>
          {/* Add other tabs here, e.g., Timeline, Status Updates, etc. */}
        </ul>
      </div>

      {/* Display tab content */}
      <Outlet /> {/* This will render content for the selected tab */}
    </div>
  );
}

export default ProjectDetailsPage;
