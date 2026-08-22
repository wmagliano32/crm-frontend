import { Bell, BellOff, BellRing, Share } from "lucide-react"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { usePushNotifications } from "@/hooks/use-push-notifications"

// Fase 2.9, Paso 0 aprobado: botón explícito, nunca pide permiso solo —
// un permiso rechazado de entrada no se puede volver a pedir. Muestra el
// estado actual (activadas/desactivadas/bloqueadas) y, en iOS sin
// instalar, instrucciones para instalar la PWA en vez de un botón que no
// va a funcionar (el push en iOS solo anda con la app agregada a la
// pantalla de inicio).
export function NotificationsButton() {
  const { status, busy, error, activate, deactivate } = usePushNotifications()
  const [open, setOpen] = useState(false)

  if (status === "loading") return null

  const Icon = status === "subscribed" ? BellRing : status === "blocked" ? BellOff : Bell

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notificaciones"
        onClick={() => setOpen(true)}
        className={status === "subscribed" ? "text-emerald-600 dark:text-emerald-500" : undefined}
      >
        <Icon className="h-4 w-4" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notificaciones</AlertDialogTitle>
            <AlertDialogDescription>
              {status === "subscribed" &&
                "Vas a recibir un aviso cuando entre un mensaje nuevo de un prospecto o cliente, incluso con la app cerrada."}
              {status === "not-subscribed" &&
                "Activalas para enterarte apenas entra un mensaje nuevo, sin tener que dejar la app abierta."}
              {status === "blocked" && "Las notificaciones están bloqueadas para este sitio en tu navegador."}
              {status === "ios-not-installed" &&
                "En iPhone/iPad, las notificaciones solo funcionan si instalás la app en la pantalla de inicio."}
              {status === "unsupported" && "Tu navegador no soporta notificaciones push."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {status === "ios-not-installed" && (
            <ol className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                  1
                </span>
                Tocá <Share className="inline h-3.5 w-3.5" aria-hidden /> (Compartir) en Safari
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                  2
                </span>
                Elegí "Agregar a pantalla de inicio"
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                  3
                </span>
                Abrí WAM CRM desde el ícono nuevo y activá las notificaciones desde ahí
              </li>
            </ol>
          )}

          {status === "blocked" && (
            <p className="text-sm text-muted-foreground">
              Para reactivarlas: tocá el ícono de candado (o "ⓘ") junto a la dirección del sitio, buscá "Notificaciones"
              y cambiala a "Permitir". Después volvé a abrir esta ventana.
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
            {status === "not-subscribed" && (
              <Button onClick={activate} disabled={busy}>
                {busy ? "Activando…" : "Activar notificaciones"}
              </Button>
            )}
            {status === "subscribed" && (
              <Button variant="outline" onClick={deactivate} disabled={busy}>
                {busy ? "Desactivando…" : "Desactivar"}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
