import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const location = useLocation(); // React Router hook to get current path

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <ul>
      <li className={location.pathname === '/profile' ? 'active' : ''}>
          <Link to="/profile">Profile</Link>
        </li>
        <li className={location.pathname === '/home' ? 'active' : ''}>
          <Link to="/home">Home</Link>
        </li>
        <li className={location.pathname === '/projects' ? 'active' : ''}>
          <Link to="/projects">Projects</Link>
        </li>
        <li className={location.pathname === '' ? 'active' : ''}>
          <Link to="">Inbox</Link>
        </li>
        <li className={location.pathname === '' ? 'active' : ''}>
          <Link to="">Notification</Link>
        </li>
        <li className={location.pathname === '' ? 'active' : ''}>
          <Link to="">Calendar</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
