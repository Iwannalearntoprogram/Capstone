import React from 'react';
import './css/homepage.css'; // Assuming your CSS file is in the same directory

const MenuBar = () => {
  return (
    <div className="main-container">
      {/* Menu bar section */}
      <div className="menubar">
        <ul>
          {/* Menu header text */}
          <p className="menu">Menu</p>

          {/* Home menu item */}
          <li className="list active">
            <b></b>
            <b></b>
            <a href="#">
              <span className="icon">
                {/* Home Icon */}
                <ico-icon name="home-outline"></ico-icon>
              </span>
              <span className="title">Home</span>
            </a>
          </li>

          {/* Projects menu item */}
          <li className="list">
            <b></b>
            <b></b>
            <a href="#">
              <span className="icon">
                <ico-icon name="projects-outline"></ico-icon>
              </span>
              <span className="title">Projects</span>
            </a>
          </li>

          {/* Inbox menu item */}
          <li className="list">
            <b></b>
            <b></b>
            <a href="#">
              <span className="icon">
                <ico-icon name="inbox-outline"></ico-icon>
              </span>
              <span className="title">Inbox</span>
            </a>
          </li>

          {/* Profile menu item */}
          <li className="list">
            <b></b>
            <b></b>
            <a href="#">
              <span className="icon">
                <ico-icon name="me-outline"></ico-icon>
              </span>
              <span className="title">Profile</span>
            </a>
          </li>

          {/* Duplicate Profile menu item */}
          <li className="list">
            <b></b>
            <b></b>
            <a href="#">
              <span className="icon">
                <ico-icon name="person-outline"></ico-icon>
              </span>
              <span className="title">Profile</span>
            </a>
          </li>

          {/* Settings menu item */}
          <li className="list">
            <b></b>
            <b></b>
            <a href="#">
              <span className="icon">
                <ico-icon name="settings-outline"></ico-icon>
              </span>
              <span className="title">Settings</span>
            </a>
          </li>

          {/* Calendar menu item */}
          <li className="list">
            <b></b>
            <b></b>
            <a href="#">
              <span className="icon">
                <ico-icon name="calendar-outline"></ico-icon>
              </span>
              <span className="title">Calendar</span>
            </a>
          </li>
        </ul>
      </div>

     

      {/* Toggle button for the menu (for responsive design or mobile view) */}
      <div className="toggle">
        {/* Icon for opening the menu */}
        <ion-icon name="menu-outline" className="open"></ion-icon>
        {/* Icon for closing the menu */}
        <ion-icon name="close-outline" className="close"></ion-icon>

         {/* New sidebar container */}
          <div className="contentbar">
            <ul className="content-list">
              <li className="Projects">
                <h1>Recently Open Projects</h1>
              
              </li>

              <li className="Tasks">
                <h1>Tasks and Deadlines for Today</h1>
                
              </li>

              <li className="Upcoming">
                <h1>Upcoming Meetings and Events</h1>
                
              </li>
            </ul>
          </div>
      </div>
    </div>
  );
};


export default MenuBar;
