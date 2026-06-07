import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegBell } from "react-icons/fa";
import { FiMenu } from "react-icons/fi";
import axios from "axios";
import Cookies from "js-cookie";
import logo from "../assets/images/logo-moss.png";
import ProfileImage from "./common/ProfileImage";
import { useAuthStore } from "../store/AuthStore";
import { titleFor } from "../utils/notifications";

const Navbar = ({ toggleSidebar }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const notifRef = useRef();

  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const { user } = useAuthStore();
  const username = user?.fullName || user?.username || "User";
  const role = (() => {
    if (!user?.role || typeof user.role !== "string") return "";
    const roleLower = user.role.toLowerCase();
    if (roleLower === "storage_admin") return "Storage Admin";
    return user.role
      .replace(/[_-]+/g, " ")
      .split(" ")
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
      .join(" ");
  })();

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

        const notifs = res.data.notifications;
        if (Array.isArray(notifs)) {
          setNotifications(notifs);
        } else if (notifs) {
          setNotifications([notifs]);
        } else {
          setNotifications([]);
        }
      } catch {
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, [serverUrl, user?.id]);

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
    <div className="fixed top-0 left-0 z-50 flex h-[50px] w-full items-center justify-between gap-3 bg-[#1D3C34] px-3 text-white shadow-md sm:px-5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Toggle navigation"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 items-center text-sm font-semibold sm:text-lg">
          <span className="truncate">Estetika</span>
          <span className="mx-1 hidden sm:inline">|</span>
          <img src={logo} alt="logo" className="hidden h-5 w-auto sm:block" />
        </div>
      </div>

      <div className="relative shrink-0" ref={notifRef}>
        <div className="flex items-center gap-2 sm:gap-4">
          <button type="button" onClick={() => setShowNotifications((prev) => !prev)}>
            <FaRegBell className="h-5 w-5 cursor-pointer text-white" />
          </button>
          <div
            className="flex cursor-pointer items-center gap-2 sm:gap-4"
            onClick={() => navigate("/dashboard/profile")}
          >
            <div className="hidden text-right md:block">
              <div className="text-sm font-semibold">{username}</div>
              <div className="text-xs text-gray-300">{role}</div>
            </div>
            <ProfileImage
              src={user?.profileImage}
              alt="Profile"
              className="h-8 w-8 rounded-full border-2 border-white bg-white"
            />
          </div>
        </div>

        {showNotifications && (
          <div className="absolute right-0 mt-4 w-[min(20rem,calc(100vw-1rem))] rounded-lg border bg-white p-4 text-black shadow-xl sm:w-80">
            <h3 className="mb-2 text-center text-lg font-semibold">Notifications</h3>
            <div className="max-h-[400px] space-y-3 overflow-y-auto">
              {notifications.length === 0 && (
                <div className="text-center text-sm text-gray-400">No notifications.</div>
              )}
              {notifications.map((notif, index) => {
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
                    className={`flex cursor-pointer items-start space-x-3 rounded-md p-2 transition hover:bg-gray-100 ${
                      route ? "hover:shadow" : ""
                    }`}
                    onClick={() => {
                      if (route) {
                        navigate(route);
                        setShowNotifications(false);
                      }
                    }}
                  >
                    <span className="text-xl">{notif.icon || "!"}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{titleFor(notif)}</p>
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
            <button
              type="button"
              onClick={() => {
                setShowNotifications(false);
                navigate("/dashboard/notification");
              }}
              className="mt-3 w-full rounded-md border-t pt-3 text-center text-sm font-semibold text-[#1D3C34] hover:underline"
            >
              View all notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
