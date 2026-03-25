import { Navigate, Outlet } from "react-router-dom";
import { getAuthenticatedUser, getDefaultRouteForRole } from "../../services/auth";

export default function GuestRoute() {
  const authenticatedUser = getAuthenticatedUser();

  if (authenticatedUser) {
    return <Navigate to={getDefaultRouteForRole(authenticatedUser.role)} replace />;
  }

  return <Outlet />;
}
