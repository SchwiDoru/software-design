import { Navigate, Outlet } from "react-router-dom";
import { getDefaultRouteForRole } from "../../services/auth";
import { useAuth } from "./AuthProvider";

export default function GuestRoute() {
  const { user: authenticatedUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking your session...
      </div>
    );
  }

  if (authenticatedUser) {
    return <Navigate to={getDefaultRouteForRole(authenticatedUser.role)} replace />;
  }

  return <Outlet />;
}
