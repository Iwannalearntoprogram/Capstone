
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
import React from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import Inbox from './pages/Inbox';
import Calendar from './pages/CalendarPage';
import NotificationPage from './pages/NotificationPage';
import { BudgetProvider } from './context/BudgetContext';
import AdminRoute from './components/AdminRoute';

// Budget Tracker Components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ProjectDetail = React.lazy(() => import('./pages/ProjectDetails'));
const Reports = React.lazy(() => import('./pages/Reports'));

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
    path: '/',
    element: <Layout />,
    children: [
      { path: 'home', element: <HomePage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'inbox', element: <Inbox /> },
      { path: 'notification', element: <NotificationPage /> },
      { path: 'calendar', element: <Calendar /> },

      // Admin protected budget routes
      {
        element: <AdminRoute />,
        children: [
          { 
            path: 'budget', 
            element: (
              <React.Suspense fallback={<div>Loading Budget Dashboard...</div>}>
                <Dashboard />
              </React.Suspense>
            ),
          },
          { 
            path: 'budget/project/:projectId', 
            element: (
              <React.Suspense fallback={<div>Loading Project Details...</div>}>
                <ProjectDetail />
              </React.Suspense>
            ),
          },
          { 
            path: 'budget/reports', 
            element: (
              <React.Suspense fallback={<div>Loading Reports...</div>}>
                <Reports />
              </React.Suspense>
            ),
          },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);

function App() {
  return (
    <BudgetProvider>
      <RouterProvider router={router} />
    </BudgetProvider>
  );
}

export default App;
