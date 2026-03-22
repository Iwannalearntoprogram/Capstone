import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation(); // React Router hook to get current path
  const role = localStorage.getItem("role");
  const handleNavigate = () => toggleSidebar?.();
  const linkClasses = "block text-inherit no-underline";

  return (
    <div
      className={`fixed top-[50px] left-0 h-[calc(100vh-50px)] w-[min(85vw,250px)] pr-6 pl-2 pt-4 bg-[#1D3C34] text-white transition-transform duration-300 z-50 overflow-y-auto ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <ul className="list-none p-0 pt-5">
        <li
          className={`px-5 py-3 cursor-pointer transition-transform duration-300 mb-4 ${
            location.pathname === "/dashboard/home"
              ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
              : "hover:translate-x-2"
          }`}
        >
          <Link
            to="/dashboard/home"
            className={linkClasses}
            onClick={handleNavigate}
          >
            Home
          </Link>
        </li>
        {role !== "storage_admin" && (
          <li
            className={`px-5 py-3 cursor-pointer transition-transform duration-300 mb-4 ${
              location.pathname === "/dashboard/projects"
                ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
                : "hover:translate-x-2"
            }`}
          >
            <Link
              to="/dashboard/projects"
              className={linkClasses}
              onClick={handleNavigate}
            >
              Projects
            </Link>
          </li>
        )}
        <li
          className={`px-5 py-3 cursor-pointer transition-transform duration-300 mb-4 ${
            location.pathname === "/dashboard/inbox"
              ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
              : "hover:translate-x-2"
          }`}
        >
          <Link
            to="/dashboard/inbox"
            className={linkClasses}
            onClick={handleNavigate}
          >
            Messages
          </Link>
        </li>
        <li
          className={`px-5 py-3 cursor-pointer transition-transform duration-300 mb-4 ${
            location.pathname === "/dashboard/calendar"
              ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
              : "hover:translate-x-2"
          }`}
        >
          <Link
            to="/dashboard/calendar"
            className={linkClasses}
            onClick={handleNavigate}
          >
            Calendar
          </Link>
        </li>
        {/* {role !== "designer" && ( */}
        <li
          className={`px-5 py-3 cursor-pointer transition-transform duration-300 mb-4 ${
            location.pathname === "/dashboard/materials" ||
            location.pathname.startsWith("/dashboard/materials/items") ||
            /^\/dashboard\/materials\/[a-zA-Z0-9]+$/.test(location.pathname)
              ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
              : "hover:translate-x-2"
          }`}
        >
          <Link
            to="/dashboard/materials/items"
            className={linkClasses}
            onClick={handleNavigate}
          >
            Materials
          </Link>
        </li>
        {/* )} */}
        {role === "storage_admin" && (
          <li
            className={`px-5 py-3 cursor-pointer transition-transform duration-300 mb-4 ${
              location.pathname === "/dashboard/materials-custom"
                ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
                : "hover:translate-x-2"
            }`}
          >
            <Link
              to="/dashboard/materials-custom"
              className={linkClasses}
              onClick={handleNavigate}
            >
              Materials Management
            </Link>
          </li>
        )}
        {role === "admin" && (
          <li
            className={`px-5 py-3 cursor-pointer transition-transform duration-300 mb-4 ${
              location.pathname === "/dashboard/add-user"
                ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
                : "hover:translate-x-2"
            }`}
          >
            <Link
              to="/dashboard/add-user"
              className={linkClasses}
              onClick={handleNavigate}
            >
              Account Management
            </Link>
          </li>
        )}
        <li
          className={`px-5 py-3 cursor-pointer transition-transform duration-300 mb-4 ${
            location.pathname === "/dashboard/profile"
              ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
              : "hover:translate-x-2"
          }`}
        >
          <Link
            to="/dashboard/profile"
            className={linkClasses}
            onClick={handleNavigate}
          >
            Profile
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
