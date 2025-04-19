import React from 'react';
import '../styles/Navbar.css';

const Navbar = ({ toggleSidebar }) => {
  return (
    <div className="navbar">
      <button onClick={toggleSidebar} className="menu-toggle">
        ☰
      </button>
      <h1 className="navbar-title">Estetika</h1>
    </div>
  );
};

export default Navbar;
