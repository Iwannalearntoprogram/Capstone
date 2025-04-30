// import React from 'react';
// import { Outlet } from 'react-router-dom';
// import Navbar from './Navbar';
// import '../styles/Layout.css';

// const Layout = () => {
//   return (
//     <>
      
//       <div className="layout-container">
//         <Outlet />
//       </div>
//     </>
//   );
// };

// export default Layout;

import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import '../styles/Layout.css';

// Icons (you can use your preferred icon library)
const HomeIcon = () => <span>🏠</span>;
const ProjectIcon = () => <span>📋</span>;
const DashboardIcon = () => <span>📊</span>;
const ReportIcon = () => <span>📈</span>;
const ProfileIcon = () => <span>👤</span>;
const InboxIcon = () => <span>📨</span>;
const NotificationIcon = () => <span>🔔</span>;
const CalendarIcon = () => <span>📅</span>;

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div className={`layout-container ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar}>
        {/* Common Navigation Items */}
        <NavLink 
          to="/home" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <HomeIcon />
          {sidebarOpen && <span>Home</span>}
        </NavLink>

        <NavLink 
          to="/projects" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ProjectIcon />
          {sidebarOpen && <span>Projects</span>}
        </NavLink>

        {/* Admin-Only Navigation Items */}
        {user?.role === 'admin' && (
          <>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <DashboardIcon />
              {sidebarOpen && <span>Dashboard</span>}
            </NavLink>

            <NavLink 
              to="/reports" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <ReportIcon />
              {sidebarOpen && <span>Reports</span>}
            </NavLink>
          </>
        )}

        {/* Common Navigation Items Continued */}
        <NavLink 
          to="/profile" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ProfileIcon />
          {sidebarOpen && <span>Profile</span>}
        </NavLink>

        <NavLink 
          to="/inbox" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <InboxIcon />
          {sidebarOpen && <span>Inbox</span>}
        </NavLink>

        <NavLink 
          to="/notification" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <NotificationIcon />
          {sidebarOpen && <span>Notifications</span>}
        </NavLink>

        <NavLink 
          to="/calendar" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <CalendarIcon />
          {sidebarOpen && <span>Calendar</span>}
        </NavLink>
      </Sidebar>
      
      <main className={`content ${sidebarOpen ? '' : 'content-expanded'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
