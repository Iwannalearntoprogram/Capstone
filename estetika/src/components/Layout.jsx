import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const location = useLocation();

  const isInbox = location.pathname.startsWith("/dashboard/inbox");

  return (
    <div
      className={`flex flex-col min-h-screen ${
        isInbox ? "bg-white" : "bg-[#F2EBE7]"
      }`}
    >
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 top-[50px] z-40 bg-black/30 lg:hidden"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          />
        )}
        <main
          className={`flex-1 text-black ${
            isInbox
              ? "pt-[50px]"
              : "px-1.5 py-6 pt-[74px] sm:px-6 lg:px-8 xl:px-12"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
