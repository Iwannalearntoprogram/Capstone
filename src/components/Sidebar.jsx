import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';
import useAuth from '../hooks/useAuth';

const Sidebar = ({ isOpen }) => {
  const location = useLocation(); // React Router hook to get current path
  const { userRole } = useAuth();

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
        {userRole === 'admin' && (
          <>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/reports">Reports</Link></li>
          </>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
