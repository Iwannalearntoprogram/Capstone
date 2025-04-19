import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/SubNavbarProjects.css'; // Optional: Custom CSS for styling

const SubNavbarProjects = () => {
  return (
    <div className="sub-navbar-projects">
      <ul>
        <li>
          <NavLink to="/projects" activeClassName="active-link">
            Projects
          </NavLink>
        </li>
        <li>
          <NavLink to="" activeClassName="active-link">
            Project Overview
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default SubNavbarProjects;
