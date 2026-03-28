import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getDefaultRouteForRole, hasRequiredRole } from "../../services/auth";
import { useAuth } from "./AuthProvider";
import type { UserRole } from "../../types";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { user: authenticatedUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Restoring your session...
      </div>
    );
  }

  if (!authenticatedUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !hasRequiredRole(authenticatedUser.role, allowedRoles)) {
    return <Navigate to={getDefaultRouteForRole(authenticatedUser.role)} replace />;
  }

  return <Outlet />;
}
