import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegBell, FaRegTrashAlt } from "react-icons/fa";
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "../config/server";
import { useAuthStore } from "../store/AuthStore";
import { titleFor } from "../utils/notifications";

// Resolve where a notification should navigate when clicked (mirrors the Navbar dropdown).
const routeFor = (notif) => {
  if (notif.event) return `/dashboard/calendar?eventId=${notif.event}`;
  if (notif.project) {
    const projectId =
      typeof notif.project === "object" ? notif.project?._id : notif.project;
    return projectId ? `/dashboard/projects/${projectId}` : null;
  }
  return null;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

function Notification() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userId = user?.id || user?._id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const authHeaders = useCallback(() => {
    const token = Cookies.get("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/user/notification?recipient=${userId}`,
        { headers: authHeaders() }
      );
      const notifs = res.data?.notifications;
      if (Array.isArray(notifs)) {
        setNotifications(notifs);
      } else if (notifs) {
        setNotifications([notifs]);
      } else {
        setNotifications([]);
      }
    } catch {
      setError("Couldn't load notifications. Please try again.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [userId, authHeaders]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (id) => {
      if (!id) return;
      // Optimistic update.
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      try {
        await axios.put(
          `${API_BASE_URL}/user/notification?id=${id}`,
          { read: true },
          { headers: authHeaders() }
        );
      } catch {
        // Re-sync from the server if the persist failed.
        fetchNotifications();
      }
    },
    [authHeaders, fetchNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await Promise.all(
        unread.map((n) =>
          axios.put(
            `${API_BASE_URL}/user/notification?id=${n._id}`,
            { read: true },
            { headers: authHeaders() }
          )
        )
      );
    } catch {
      fetchNotifications();
    }
  }, [notifications, authHeaders, fetchNotifications]);

  const removeNotification = useCallback(
    async (id) => {
      if (!id) return;
      const previous = notifications;
      // Optimistic removal.
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      try {
        await axios.delete(`${API_BASE_URL}/user/notification?id=${id}`, {
          headers: authHeaders(),
        });
      } catch {
        // Restore on failure.
        setNotifications(previous);
      }
    },
    [notifications, authHeaders]
  );

  const handleOpen = (notif) => {
    if (!notif.read) markAsRead(notif._id);
    const route = routeFor(notif);
    if (route) navigate(route);
  };

  const visibleNotifications = useMemo(
    () => (showOnlyUnread ? notifications.filter((n) => !n.read) : notifications),
    [notifications, showOnlyUnread]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-md sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1D3C34]">Notifications</h1>
          <p className="mt-1 text-sm text-gray-600">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${
                  unreadCount === 1 ? "" : "s"
                }.`
              : "You're all caught up."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOnlyUnread((prev) => !prev)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              showOnlyUnread
                ? "border-[#1D3C34] bg-[#1D3C34] text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {showOnlyUnread ? "Showing unread" : "Show unread"}
          </button>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all read
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-500">
            Loading notifications…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
            {error}
            <button
              type="button"
              onClick={fetchNotifications}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && visibleNotifications.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
            <FaRegBell className="mx-auto mb-3 h-7 w-7 text-gray-400" />
            {showOnlyUnread && notifications.length > 0
              ? "No unread notifications."
              : "No notifications yet."}
          </div>
        )}

        {!loading &&
          !error &&
          visibleNotifications.map((notif) => {
            const route = routeFor(notif);
            return (
              <div
                key={notif._id}
                className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                  notif.read
                    ? "border-gray-200 bg-white"
                    : "border-[#1D3C34]/30 bg-[#1D3C34]/5"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    notif.read
                      ? "bg-gray-100 text-gray-500"
                      : "bg-[#1D3C34]/10 text-[#1D3C34]"
                  }`}
                >
                  <FaRegBell className="h-4 w-4" />
                </span>

                <div
                  className={`min-w-0 flex-1 ${route ? "cursor-pointer" : ""}`}
                  onClick={() => handleOpen(notif)}
                >
                  <div className="flex items-center gap-2">
                    <p
                      className={`truncate ${
                        notif.read
                          ? "font-medium text-gray-700"
                          : "font-semibold text-black"
                      }`}
                    >
                      {titleFor(notif)}
                    </p>
                    {!notif.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#1D3C34]" />
                    )}
                  </div>
                  {notif.message && (
                    <p className="mt-0.5 text-sm text-gray-600">{notif.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(notif.createdAt)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {!notif.read && (
                    <button
                      type="button"
                      onClick={() => markAsRead(notif._id)}
                      className="text-xs font-medium text-[#1D3C34] hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeNotification(notif._id)}
                    className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    aria-label="Delete notification"
                  >
                    <FaRegTrashAlt className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default Notification;
