// import React, { useState } from "react";
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';

// function ProfilePage () {
//     // // Define the state to control the sidebar's open/close state
//     // const [sidebarOpen, setSidebarOpen] = useState(true);

//     // // Function to toggle the sidebar visibility
//     // const toggleSidebar = () => setSidebarOpen(prevState => !prevState);

//     return (
//         <>
//             {/* Passing down the state and toggle function to Navbar and Sidebar */}
//             {/* <Navbar toggleSidebar={toggleSidebar} />
//             <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} /> */}
            
//             <h1>This is the Profile page.</h1>
//         </>
//     );
// }

// export default ProfilePage;

import React from 'react';
import '../styles/Profile.css';


const ProfilePage = () => {
  return (
    <div className="container">
      <div className="profile-box">
        <div className="profile-content">
          
            <h1>Elijan Angelo DR</h1>
            <p>Interior Designer</p>
          </div>
        </div>
      </div>
  
  );
};

export default ProfilePage;

