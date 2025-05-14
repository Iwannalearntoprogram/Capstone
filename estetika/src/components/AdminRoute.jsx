import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const AdminRoute = () => {
  const { userRole } = useAuth();

  if (userRole === null) {
    // Could show a loading spinner here if needed
    return null;
  }

  return userRole === 'admin' ? <Outlet /> : <Navigate to="/home" replace />;
};

export default AdminRoute;