import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    // Avoid flashing the login page while session is being fetched
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
