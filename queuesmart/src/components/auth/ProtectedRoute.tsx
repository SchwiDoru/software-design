import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAuthenticatedUser, getDefaultRouteForRole, hasRequiredRole } from "../../services/auth";
import type { UserRole } from "../../types";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const authenticatedUser = getAuthenticatedUser();

  if (!authenticatedUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !hasRequiredRole(authenticatedUser.role, allowedRoles)) {
    return <Navigate to={getDefaultRouteForRole(authenticatedUser.role)} replace />;
  }

  return <Outlet />;
}
