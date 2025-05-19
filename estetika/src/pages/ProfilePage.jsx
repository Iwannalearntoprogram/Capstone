import React, { useState } from "react";
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';

function ProfilePage() {
  // // Define the state to control the sidebar's open/close state
  // const [sidebarOpen, setSidebarOpen] = useState(true);

  // // Function to toggle the sidebar visibility
  // const toggleSidebar = () => setSidebarOpen(prevState => !prevState);

  return (
    <>
      {/* Passing down the state and toggle function to Navbar and Sidebar */}
      {/* <Navbar toggleSidebar={toggleSidebar} />
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} /> */}

      <div className="flex w-full h-full bg-blue-50 gap-4 px-20">
        <div className="w-1/4 bg-white"></div>
        <div className="flex-1 bg-white"></div>
        <div className="w-1/4 bg-white"></div>
      </div>
    </>
  );
}

export default ProfilePage;
