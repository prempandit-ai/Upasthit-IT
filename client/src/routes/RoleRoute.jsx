import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  const userRoles = user?.roles || (user?.role ? [user.role] : []);

  if (!allowedRoles.some((role) => userRoles.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
