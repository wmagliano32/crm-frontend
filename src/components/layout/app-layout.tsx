import { Outlet } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

const ROL_LABEL: Record<string, string> = {
  ADMIN_CRM: "Admin CRM",
  COMERCIAL: "Comercial",
  SOPORTE: "Soporte",
}

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
        <span className="text-sm font-semibold tracking-tight">WAM CRM</span>
        {user && (
          <div className="flex items-center gap-2">
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
