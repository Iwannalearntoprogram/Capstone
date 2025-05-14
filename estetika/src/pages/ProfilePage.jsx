import React, { useState } from "react";
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

function ProfilePage () {
    // // Define the state to control the sidebar's open/close state
    // const [sidebarOpen, setSidebarOpen] = useState(true);

    // // Function to toggle the sidebar visibility
    // const toggleSidebar = () => setSidebarOpen(prevState => !prevState);

    return (
        <>
            {/* Passing down the state and toggle function to Navbar and Sidebar */}
            {/* <Navbar toggleSidebar={toggleSidebar} />
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} /> */}
            
            <h1>This is the Profile page.</h1>
        </>
    );
}

export default ProfilePage;
