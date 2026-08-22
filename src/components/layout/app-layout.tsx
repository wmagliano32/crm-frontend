import { NavLink, Outlet } from "react-router-dom"
import { NotificationsButton } from "@/components/layout/notifications-button"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const ROL_LABEL: Record<string, string> = {
  ADMIN_CRM: "Admin CRM",
  COMERCIAL: "Comercial",
  SOPORTE: "Soporte",
}

// Fase 2.12, decisión aprobada: dos links de texto, no un sidebar — el
// primer elemento de navegación real de la app (hasta acá el header solo
// tenía logo/notificaciones/usuario) y va a seguir siendo así mientras
// solo haya dos destinos. Un sidebar acá sería over-engineering.
function NavLinks() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-md px-2 py-1 text-sm font-medium transition-colors",
      isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
    )
  return (
    <nav className="flex items-center gap-1">
      <NavLink to="/" end className={linkClass}>
        Bandeja
      </NavLink>
      <NavLink to="/demos" className={linkClass}>
        Demos
      </NavLink>
    </nav>
  )
}

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold tracking-tight">WAM CRM</span>
          <NavLinks />
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <NotificationsButton />
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-muted-foreground">{ROL_LABEL[user.crm_rol] ?? user.crm_rol}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              Salir
            </Button>
          </div>
        )}
      </header>
      {/* Sin padding acá a propósito: la bandeja (y el hilo, en la 2.2) usan
          el ancho y alto completos, cada una maneja su propio espaciado interno. */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
