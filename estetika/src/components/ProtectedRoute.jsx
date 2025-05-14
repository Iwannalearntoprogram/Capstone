import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    // If not logged in, redirect to login page
    return <Navigate to="/" state={{ from: location }} />;
  }

  if (requiredRole && role !== requiredRole) {
    // If user doesn't have the required role, redirect to home or another page
    return <Navigate to="/home" />;
  }

  return children; // If all checks pass, render the protected component
};

export default ProtectedRoute;
