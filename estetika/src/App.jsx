
// import './App.css';
// import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// import Layout from './components/Layout';
// import HomePage from './pages/HomePage';
// import ProjectsPage from './pages/ProjectsPage';
// import LoginPage from './pages/LoginPage';
// import SignupPage from './pages/SignupPage';
// import ProfilePage from './pages/ProfilePage';

// const routes = [
//   {
//     path: '/',
//     element: <Layout />,
//     children: [
//       {
//         path: 'profile', 
//         element: <ProfilePage />,
//       },
//       {
//         path: 'home',
//         element: <HomePage />,
//       },
//       {
//         path: 'projects',
//         element: <ProjectsPage />,
//       },
//       {
//         path: '/',
//         element: <LoginPage />,
//       },
//       {
//         path: 'signup',
//         element: <SignupPage />,
//       },
//     ],
//   },
// ];

// const router = createBrowserRouter(routes);

// function App() {
//   return <RouterProvider router={router} />;
// }

// export default App;
import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import Inbox from './pages/Inbox';
import Calendar from './pages/CalendarPage';
import NotificationPage from './pages/NotificationPage';

const routes = [
  // Routes for Login and Signup (no layout)
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },

  // Routes for pages that should use the layout
  {
    path: '/', // Use a different path for layout
    element: <Layout />, // Layout with Sidebar and Navbar
    children: [
      { path: 'home', element: <HomePage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'inbox', element: <Inbox /> },
      { path: 'notification', element: <NotificationPage /> },
      { path: 'calendar', element: <Calendar /> },
    ],
  },
];

const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
