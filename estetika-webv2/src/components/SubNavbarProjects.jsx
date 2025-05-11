// import React from 'react';
// import { NavLink } from 'react-router-dom';
// import '../styles/SubNavbarProjects.css'; // Optional: Custom CSS for styling

// const SubNavbarProjects = () => {
//   return (
//     <div className="sub-navbar-projects">
//       <ul>
//         <li>
//           <NavLink to="/projects" activeClassName="active-link">
//             Projects
//           </NavLink>
//         </li>
        
//       </ul>
//     </div>
//   );
// };

// export default SubNavbarProjects;

import React from 'react';
import { NavLink } from 'react-router-dom';

const SubNavbarProjects = () => {
  return (
    <div className="subnavbar">
      <NavLink to="tasks">Tasks</NavLink>
      <NavLink to="progress">Progress</NavLink>
      <NavLink to="timeline">Timeline</NavLink>
      <NavLink to="goals">Goal Tracking</NavLink>
      <NavLink to="status">Status Updates</NavLink>
      <NavLink to="files">Files</NavLink>
    </div>
  );
};

export default SubNavbarProjects;
