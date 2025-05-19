import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import marbleBg from "../assets/images/white-marble-bg.png"; // Import the image

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const location = useLocation();

  // Check if current route is /inbox
  const isInbox = location.pathname.startsWith("/inbox");

  return (
    <div
      className={`flex flex-col min-h-screen ${
        isInbox ? "bg-white" : "bg-[#F2EBE7]"
      }`}
    >
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main
          className={`flex-1 text-black ${
            isInbox ? "" : "p-12 pt-[calc(50px+3rem)]"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
