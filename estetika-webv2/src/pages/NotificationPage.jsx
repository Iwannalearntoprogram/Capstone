// import React, { useState } from 'react';
// import '../styles/Layout.css';

// import '../styles/notifications.css';
// const NotificationPage = () => {
//     const notifications = [
//       { id: 1, title: "New message from Alice", time: "Just now", unread: true },
//       { id: 2, title: "Project updated by Bob", time: "10 minutes ago", unread: true },
//       { id: 3, title: "Reminder: Team meeting at 3PM", time: "1 hour ago", unread: false },
//       { id: 4, title: "You were mentioned by Carol", time: "Yesterday", unread: false },
//     ];
  
//     // TODO: Replace static list with fetch from backend API
  
//     return (
//       <div className="notifications-page">
//         <div className="notifications-header">
//           <h1>Notifications</h1>
//         </div>
//         <div className="notifications-list">
//           {notifications.map((notif) => (
//             <div
//               key={notif.id}
//               className={`notification-item ${notif.unread ? 'unread' : ''}`}
//             >
//               <div className="notification-content">
//                 <span className="notification-title">{notif.title}</span>
//                 <span className="notification-time">{notif.time}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };
  
//   export default NotificationPage;
