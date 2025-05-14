// import React from "react";

// function AboutPage (){
//     return (
//         <div>

//             <h1>About Us </h1>
//             <p>
//         Welcome to Eli's Website, where innovation meets purpose. We are a passionate team dedicated to creating solutions that enhance everyday
//         life through technology. Our mission is to develop intuitive, user-friendly web and mobile applications that address real-world
//         challenges and empower individuals and businesses alike. At React, we value creativity, integrity, and excellence. Whether it's
//         improving efficiency, promoting sustainability, or fostering seamless digital experiences, we strive to make a meaningful impact
//          with every project we build.</p>
//         </div>

//     );
// }

// export default AboutPage;

// import React, { useState } from 'react';
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';

// const AboutPage = () => {
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const toggleSidebar = () => setSidebarOpen(prev => !prev);

//   return (
//     <div>
//       {/* <Navbar toggleSidebar={toggleSidebar} />
//       <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} /> */}

//       <main className="">
//         <h1 className="">Projects page</h1>
//         <p>Estetika's Projects</p>
//       </main>
//     </div>
//   );
// };

// export default AboutPage;

import React, { useState } from "react";
import SubNavbarProjects from "../components/SubNavbarProjects"; // Import SubNavbar
// import '../styles/Projects.css';

const ProjectsPage = () => {
  // Sample project data (you can replace this with data from your backend later)
  const [projects] = useState([
    {
      id: 1,
      title: "Redesign Website",
      description: "A complete redesign of the company website.",
      status: "In Progress",
      deadline: "May 31, 2025",
      assignedTo: "Jane Doe",
    },
    {
      id: 2,
      title: "Mobile App UI/UX",
      description: "Design the UI/UX for a mobile application.",
      status: "Pending",
      deadline: "June 15, 2025",
      assignedTo: "John Smith",
    },
    {
      id: 3,
      title: "Landing Page Design",
      description: "Design a landing page for a new product launch.",
      status: "Completed",
      deadline: "April 30, 2025",
      assignedTo: "Alice Brown",
    },
    {
      id: 4,
      title: "Landing Page Design",
      description: "Design a landing page for a new product launch.",
      status: "Completed",
      deadline: "April 30, 2025",
      assignedTo: "Alice Brown",
    },
  ]);

  return (
    <div>
      {/* <SubNavbarProjects /> SubNavbar component */}

      {/* Page Heading */}
      <div className="projects-header">
        <h1>Projects</h1>
        <p>Estetika's Ongoing and Completed Projects</p>
      </div>

      {/* Projects Overview Section */}
      <div className="projects-overview">
        <h2>Projects Overview</h2>
        <div className="projects-list">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="project-details">
                <span>
                  <strong>Status:</strong> {project.status}
                </span>
                <span>
                  <strong>Deadline:</strong> {project.deadline}
                </span>
                <span>
                  <strong>Assigned To:</strong> {project.assignedTo}
                </span>
              </div>
              <button
                className="view-project-button"
                onClick={() => alert(`View details of ${project.title}`)}
              >
                View Project Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add a section for any other content you'd like, such as project actions */}
    </div>
  );
};

export default ProjectsPage;
