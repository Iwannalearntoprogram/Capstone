import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";

const PublicOnlyRoute = ({ children }) => {
  const token = Cookies.get("token");

  if (token) {
    return <Navigate to="/dashboard/home" replace />;
  }

  return children;
};

export default PublicOnlyRoute;
