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
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
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
      <main className="flex flex-1 flex-col px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}
