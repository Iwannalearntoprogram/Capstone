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
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import '../styles/Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div className="layout-container">
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <main className="content">
        <Outlet /> {/* this will render the page content like Home/Profile/etc */}
      </main>
    </div>
  );
};

export default Layout;
