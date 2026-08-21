import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"

export function ProtectedRoute() {
  const { status } = useAuth()

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground text-sm">
        Cargando…
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
