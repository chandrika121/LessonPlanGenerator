import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/auth";
import { roleRoutes } from "../utils/navigation";

export function ProtectedRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { isAuthenticated, isReady, role } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-500">Preparing workspace...</div>;
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={roleRoutes[role].dashboardPath} replace />;
  }

  return <Outlet />;
}
