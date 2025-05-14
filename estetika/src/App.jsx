
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
import CalendarPage from './pages/CalendarPage';
import NotificationPage from './pages/NotificationPage';

// Import the new project detail pages
import DesignerProjectsPage from './pages/DesignerProjectsPage';  // This would be your "Designer Projects Page"
import ProjectDetailsPage from './pages/ProjectDetailsPage';  // This would be your "Project Details Page"
import AdminProjectsPage from './pages/AdminProjectsPage';

// Import tab content components
import TasksTab from './components/TasksTab';  // Tasks tab content
import ProgressTab from './components/ProgressTab';  // Progress tab content
import FilesTab from './components/FilesTab';  // Files tab content

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
      // { path: 'projects', element: <ProjectsPage /> },
      { path: 'inbox', element: <Inbox /> },
      { path: 'notification', element: <NotificationPage /> },
      { path: 'calendar', element: <CalendarPage /> },

      // Add the new routes for designer projects and project details
      // { path: 'projects', element: <DesignerProjectsPage /> },

      { path: 'projects', element: <AdminProjectsPage /> },


      {
        path: 'projects/:projectId',
        element: <ProjectDetailsPage />,
        children: [
          { path: 'tasks', element: <TasksTab /> },
          { path: 'progress', element: <ProgressTab /> },
          { path: 'files', element: <FilesTab /> },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
