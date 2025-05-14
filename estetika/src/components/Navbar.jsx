import React from "react";
import logo from "../assets/images/logo-moss.png";

const Navbar = ({ toggleSidebar }) => {
  return (
    <div className="fixed top-0 left-0 w-full h-[50px] bg-[#1D3C34] text-white flex items-center px-5 shadow-md z-50">
      <button
        onClick={toggleSidebar}
        className="text-[20px] bg-transparent text-white border-none cursor-pointer mr-4 focus:outline-none"
      >
        ☰
      </button>
      <img src={logo} alt="logo" className="h-auto max-h-full w-auto m-auto" />
    </div>
  );
};

export default Navbar;
