import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  const location = useLocation();
  const token = true;
  const role = localStorage.getItem("role");

  console.log(token);
  console.log(role);

  if (token && (location.pathname === "/" || location.pathname === "/signup")) {
    return <Navigate to="/home" />;
  }

  // If not logged in, only allow access to login or signup
  if (!token && location.pathname !== "/" && location.pathname !== "/signup") {
    return <Navigate to="/" state={{ from: location }} />;
  }

  // if (requiredRole && role !== requiredRole) {
  //   // If user doesn't have the required role, redirect to home or another page
  //   return <Navigate to="/home" />;
  // }

  return children;
};

export default ProtectedRoute;
