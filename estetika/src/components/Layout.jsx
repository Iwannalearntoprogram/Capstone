import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import marbleBg from "../assets/images/white-marble-bg.png"; // Import the image

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    // <div
    //   className="flex flex-col min-h-screen bg-cover bg-center bg-no-repeat"
    //   style={{ backgroundImage: `url(${marbleBg})` }} // Use the imported image
    // >
    <div className="flex flex-col min-h-screen bg-[#F2EBE7]">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 text-black p-12 pt-[calc(50px+3rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
