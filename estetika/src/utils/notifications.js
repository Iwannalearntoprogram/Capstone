// Shared helpers for rendering notifications consistently across the app
// (the full NotificationPage and the Navbar dropdown).

// Map the backend notification `type` enum to a friendly title.
export const TYPE_TITLES = {
  assigned: "Task Assigned",
  overdue: "Task Overdue",
  "phase-started": "Phase Started",
  "phase-completed": "Phase Completed",
  alarm: "Event Reminder",
  update: "Update",
  "project-approved": "Project Approved",
};

export const titleFor = (notif) =>
  notif?.title || TYPE_TITLES[notif?.type] || "Notification";
