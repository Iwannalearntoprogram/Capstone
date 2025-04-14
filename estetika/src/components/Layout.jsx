import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import '../styles/Layout.css';

const Layout = () => {
  return (
    <>
      
      <div className="layout-container">
        <Outlet />
      </div>
    </>
  );
};

export default Layout;

