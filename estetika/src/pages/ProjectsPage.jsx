// import React from "react";

// function AboutPage (){
//     return (
//         <div>
            
//             <h1>About Us </h1>
//             <p>
//         Welcome to Eli's Website, where innovation meets purpose. We are a passionate team dedicated to creating solutions that enhance everyday 
//         life through technology. Our mission is to develop intuitive, user-friendly web and mobile applications that address real-world 
//         challenges and empower individuals and businesses alike. At React, we value creativity, integrity, and excellence. Whether it's 
//         improving efficiency, promoting sustainability, or fostering seamless digital experiences, we strive to make a meaningful impact
//          with every project we build.</p>
//         </div>
        

//     );
// }

// export default AboutPage;


import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const AboutPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div>
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="">
        <h1 className="">Projects page</h1>
        <p>Estetika's Projects</p>
      </main>
    </div>
  );
};

export default AboutPage;