import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen }) => {
  const location = useLocation(); // React Router hook to get current path
  const role = localStorage.getItem("role");

  return (
    <div
      className={`fixed top-[50px] left-0 h-full min-w-[250px] pr-8 pl-2 pt-4 bg-[#1D3C34] text-white transition-transform duration-300 z-[999] ${
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
            className="block text-inherit no-underline"
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
              className="block text-inherit no-underline"
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
            className="block text-inherit no-underline"
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
            className="block text-inherit no-underline "
          >
            Calendar
          </Link>
        </li>
        {/* {role !== "designer" && ( */}
        <li
          className={`px-5 py-3 cursor-pointer transition-transform duration-300 mb-4 ${
            location.pathname.includes("/dashboard/materials")
              ? "bg-[#f2ebe7] text-black rounded-xl shadow-md translate-x-5"
              : "hover:translate-x-2"
          }`}
        >
          <Link
            to="/dashboard/materials/items"
            className="block text-inherit no-underline"
          >
            Materials
          </Link>
        </li>
        {/* )} */}
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
              className="block text-inherit no-underline"
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
            className="block text-inherit no-underline"
          >
            Profile
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
