
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
import MaterialsPage from './pages/MaterialsPage';
import { BudgetProvider } from './context/BudgetContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Reports = React.lazy(() => import('./pages/Reports'));

// Define routes before using them
const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/unauthorized',
    element: <div>You don't have permission to access this page</div>,
  },
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
      {
        path: 'dashboard',
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
          { index: true, element: <Dashboard /> }
        ]
      },
      {
        path: 'reports',
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
          { index: true, element: <Reports /> }
        ]
      },
      {
        path: 'materialspage',
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
          { index: true, element: <MaterialsPage /> }
        ]
      },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <BudgetProvider>
        <RouterProvider router={router} />
      </BudgetProvider>
    </AuthProvider>
  );
}

export default App;
