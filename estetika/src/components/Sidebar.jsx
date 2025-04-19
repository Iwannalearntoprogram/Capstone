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
        <li className={location.pathname === '/inbox' ? 'active' : ''}>
          <Link to="/inbox">Inbox</Link>
        </li>
        <li className={location.pathname === '/notification' ? 'active' : ''}>
          <Link to="/notification">Notification</Link>
        </li>
        <li className={location.pathname === '/calendar' ? 'active' : ''}>
          <Link to="/calendar">Calendar</Link>
          
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
