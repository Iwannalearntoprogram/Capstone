import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegBell } from "react-icons/fa";
import axios from "axios";
import Cookies from "js-cookie";
import logo from "../assets/images/logo-moss.png";
import defaultProfile from "../assets/images/user.png";
import { useAuthStore } from "../store/AuthStore";

const Navbar = ({ toggleSidebar }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const notifRef = useRef();

  const serverUrl = import.meta.env.VITE_SERVER_URL;

  // Get user from auth store
  const { user } = useAuthStore();
  const username = user?.fullName || user?.username || "User";
  const role = (() => {
    if (!user?.role || typeof user.role !== "string") return "";
    const roleLower = user.role.toLowerCase();
    if (roleLower === "storage_admin") return "Storage Admin";
    const formatted = user.role.replace(/[_-]+/g, " ");
    return formatted
      .split(" ")
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
      .join(" ");
  })();

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      try {
        const token = Cookies.get("token");
        const res = await axios.get(
          `${serverUrl}/api/user/notification?recipient=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Ensure notifications is always an array
        let notifs = res.data.notifications;
        if (notifs) {
          if (Array.isArray(notifs)) {
            setNotifications(notifs);
          } else {
            setNotifications([notifs]);
          }
        } else {
          setNotifications([]);
        }
      } catch (err) {
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-[50px] bg-[#1D3C34] text-white flex items-center justify-between px-5 shadow-md z-50">
      {/* Left */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="text-[20px] text-white focus:outline-none"
        >
          ☰
        </button>
        <div className="text-white font-semibold text-lg flex items-center">
          <span className="mr-1">Estetika</span>
          <span className="mx-1">|</span>
          <img src={logo} alt="logo" className="h-5 w-auto" />
        </div>
      </div>

      {/* Right */}
      <div className="relative" ref={notifRef}>
        <div className="flex items-center space-x-4">
          <button onClick={() => setShowNotifications(!showNotifications)}>
            <FaRegBell className="w-5 h-5 text-white cursor-pointer" />
          </button>
          <div
            className="flex gap-4 cursor-pointer"
            onClick={() => navigate("/dashboard/profile")}
          >
            <div className="text-right">
              <div className="text-sm font-semibold">{username}</div>
              <div className="text-xs text-gray-300">{role}</div>
            </div>
            <img
              src={user?.profileImage || defaultProfile}
              alt="Profile"
              className="h-8 w-8 rounded-full border-2 border-white bg-white"
            />
          </div>
        </div>

        {showNotifications && (
          <div className="absolute right-32 mt-4 w-80 bg-white text-black rounded-lg shadow-xl z-50 p-4 border">
            <h3 className="text-lg font-semibold mb-2 text-center">
              Notifications
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {notifications.length === 0 && (
                <div className="text-center text-gray-400 text-sm">
                  No notifications.
                </div>
              )}
              {notifications.map((notif, index) => {
                // Determine route based on notification type or attached IDs
                let route = null;
                if (notif.event) {
                  route = `/calendar?eventId=${notif.event}`;
                } else if (notif.project) {
                  route = `/projects/${notif.project}`;
                } else if (notif.task) {
                  route = `/tasks/${notif.task}`;
                }
                return (
                  <div
                    key={notif._id || index}
                    className={`flex items-start space-x-3 cursor-pointer hover:bg-gray-100 rounded-md p-2 transition ${
                      route ? "hover:shadow" : ""
                    }`}
                    onClick={() => {
                      if (route) {
                        navigate(route);
                        setShowNotifications(false);
                      }
                    }}
                  >
                    <span className="text-xl">{notif.icon || "🔔"}</span>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {notif.title || "Notification"}
                      </p>
                      <p className="text-sm text-gray-600">{notif.message}</p>
                      <p className="text-xs text-gray-400">
                        {notif.time || notif.createdAt
                          ? new Date(notif.createdAt).toLocaleString()
                          : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
