import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen }) => {
  const location = useLocation(); // React Router hook to get current path

  return (
    <div
      className={`fixed top-[50px] left-0 h-full min-w-[250px] pr-8 pl-2 pt-4 bg-[#1D3C34] text-white transition-transform duration-300 z-[999] ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <ul className="list-none p-0 pt-5">
        <li
          className={`px-5 py-3 cursor-pointer transition-transform duration-300 mb-4 ${
            location.pathname === "/profile"
              ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
              : "hover:translate-x-2"
          }`}
        >
          <Link to="/profile" className="block text-inherit no-underline">
            Profile
          </Link>
        </li>
        <li
          className={`px-5 py-3 cursor-pointer transition-transform duration-300 mb-4 ${
            location.pathname === "/home"
              ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
              : "hover:translate-x-2"
          }`}
        >
          <Link to="/home" className="block text-inherit no-underline">
            Home
          </Link>
        </li>
        <li
          className={`px-5 py-3 cursor-pointer transition-transform duration-300 mb-4 ${
            location.pathname === "/projects"
              ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
              : "hover:translate-x-2"
          }`}
        >
          <Link to="/projects" className="block text-inherit no-underline">
            Projects
          </Link>
        </li>
        <li
          className={`px-5 py-3 cursor-pointer transition-transform duration-300 mb-4 ${
            location.pathname === "/inbox"
              ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
              : "hover:translate-x-2"
          }`}
        >
          <Link to="/inbox" className="block text-inherit no-underline">
            Inbox
          </Link>
        </li>
        <li
          className={`px-5 py-3 cursor-pointer transition-transform duration-300 ${
            location.pathname === "/notification"
              ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
              : "hover:translate-x-2"
          }`}
        >
          <Link
            to="/notification"
            className="block text-inherit no-underline mb-4"
          >
            Notification
          </Link>
        </li>
        <li
          className={`px-5 py-3 cursor-pointer transition-transform duration-300 ${
            location.pathname === "/calendar"
              ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
              : "hover:translate-x-2"
          }`}
        >
          <Link to="/calendar" className="block text-inherit no-underline mb-4">
            Calendar
          </Link>
        </li>
        <li
          className={`px-5 py-3 cursor-pointer transition-transform duration-300 ${
            location.pathname === "/calendar"
              ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
              : "hover:translate-x-2"
          }`}
        >
          <Link
            to="/materials/items"
            className="block text-inherit no-underline"
          >
            Materials
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
