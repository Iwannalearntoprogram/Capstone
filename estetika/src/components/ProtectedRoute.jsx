import { Navigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";

const ProtectedRoute = ({ children, requiredRole }) => {
  const location = useLocation();
  const token = Cookies.get("token");
  const role = localStorage.getItem("role");

  if (token && (location.pathname === "/" || location.pathname === "/signup")) {
    return <Navigate to="/home" />;
  }

  if (!token && location.pathname !== "/" && location.pathname !== "/signup") {
    return <Navigate to="/" state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
