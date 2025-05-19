import React, { useState } from "react";
import sofaImg from "../assets/images/sofa.jpg"; // <-- Import the sofa image

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

      <div className="flex w-full min-h-full gap-4 px-32">
        <div className="w-1/4 ">
          <div className="flex justify-center bg-white p-4 rounded-lg shadow-md">
            <div className="">
              <img
                src={sofaImg}
                alt="Profile"
                className="w-32 h-32 object-cover rounded-full mb-2 ring-2 ring-pink-500 ring-offset-2"
              />
              <h2 className="text-center font-bold">Name</h2>
              <p className="text-center">role</p>
            </div>
          </div>
        </div>
        <div className="flex-1 ">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="font-bold">About me</h2>
          </div>
        </div>
        <div className="w-1/4 ">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold">Project</h2>
              <button className="text-sm font-bold text-pink-500">
                View All
              </button>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <div>
                <div className="w-24 h-24 rounded-lg bg-violet-200 mb-4"></div>
                <p className="text-center text-xs">Lorem ipsum</p>
              </div>
              <div>
                <div className="w-24 h-24 rounded-lg bg-violet-200 mb-4"></div>
                <p className="text-center text-xs">Lorem ipsum</p>
              </div>
              <div>
                <div className="w-24 h-24 rounded-lg bg-violet-200 mb-4"></div>
                <p className="text-center text-xs">Lorem ipsum</p>
              </div>
              <div>
                <div className="w-24 h-24 rounded-lg bg-violet-200 mb-4"></div>
                <p className="text-center text-xs">Lorem ipsum</p>
              </div>
              <div>
                <div className="w-24 h-24 rounded-lg bg-violet-200 mb-4"></div>
                <p className="text-center text-xs">Lorem ipsum</p>
              </div>
              <div>
                <div className="w-24 h-24 rounded-lg bg-violet-200 mb-4"></div>
                <p className="text-center text-xs">Lorem ipsum</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;
