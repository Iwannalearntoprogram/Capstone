import React from "react";
function Notification() {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-md sm:p-8">
      <h1 className="text-2xl font-bold text-[#1D3C34]">Notifications</h1>
      <p className="mt-2 text-sm text-gray-600 sm:text-base">
        Notification details and activity updates will appear here.
      </p>
      <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-500">
        No notifications available yet.
      </div>
    </div>
  );
}

export default Notification;
