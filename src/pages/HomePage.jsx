// import React from "react";

// function HomePage (){
//     return (
//         <> 
//         <h1>Welcome to Our Website! </h1>
//         <p>

//             Welcome to Eli's Website, where innovation and creativity come together to provide you with top-notch digital experiences. We are dedicated to creating intuitive and dynamic web and mobile applications that cater to your needs.
//             Whether you are looking for a reliable service, an engaging experience, or simply a way to connect with others, we are here to help you every step of the way. Our team is passionate about using the latest technologies to build solutions that solve real-world problems and help individuals and businesses thrive.</p></>
//     );
// }

// export default HomePage;

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const HomePage = () => {
  // const [sidebarOpen, setSidebarOpen] = useState(true);
  // const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div>
      {/* <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} /> */}
      <main className="content">
        <h1>Home Page</h1>
        <p>Estetika's Home Page</p>
      </main>
    </div>
  );
};

export default HomePage;

