import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  const location = useLocation();
  // const token = localStorage.getItem("token");
  const token = "token";
  const role = localStorage.getItem("role");

  console.log(token);
  console.log(role);

  if (token && location.pathname === "/") {
    return <Navigate to="/home" />;
  }

  if (!token) {
    return <Navigate to="/" state={{ from: location }} />;
  }

  // if (requiredRole && role !== requiredRole) {
  //   // If user doesn't have the required role, redirect to home or another page
  //   return <Navigate to="/home" />;
  // }

  return children;
};

export default ProtectedRoute;
