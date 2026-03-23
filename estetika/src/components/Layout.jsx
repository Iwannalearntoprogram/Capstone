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
      className={`flex min-h-screen flex-col overflow-x-hidden ${
        isInbox ? "bg-white" : "bg-[#F2EBE7]"
      }`}
    >
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex min-w-0 flex-1">
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
          className={`min-w-0 flex-1 overflow-x-hidden text-black ${
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
