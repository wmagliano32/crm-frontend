import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

const ROL_LABEL: Record<string, string> = {
  ADMIN_CRM: "Admin CRM",
  COMERCIAL: "Comercial",
  SOPORTE: "Soporte",
}

export function BandejaPage() {
  const { user } = useAuth()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Bandeja</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Placeholder de la Fase 2.0 — la bandeja real llega en la Fase 2.1.
          </p>
          {user && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-sm font-medium">{user.username}</span>
              <Badge variant="secondary">{ROL_LABEL[user.crm_rol] ?? user.crm_rol}</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
