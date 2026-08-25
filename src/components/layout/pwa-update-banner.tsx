import { RefreshCw, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { usePwaUpdate } from "@/hooks/use-pwa-update"

// Fase 3.5, diseño aprobado: aviso persistente cuando el service worker
// detecta una versión nueva -- discreto, pero NO se puede descartar de
// forma permanente (el botón de la derecha minimiza a una pastilla
// chica, sigue visible, nunca desaparece del todo mientras needRefresh
// esté prendido). No recarga solo: el usuario puede estar escribiendo
// un mensaje. updateServiceWorker() manda el mensaje SKIP_WAITING al SW
// en espera y recarga automáticamente una vez que toma control (ver
// sw.ts) -- no hace falta un reload manual acá.
export function PwaUpdateBanner() {
  const { needRefresh, updateServiceWorker } = usePwaUpdate()
  const [minimized, setMinimized] = useState(false)
  const [updating, setUpdating] = useState(false)

  if (!needRefresh) return null

  async function handleUpdate() {
    setUpdating(true)
    await updateServiceWorker()
  }

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        aria-label="Hay una versión nueva disponible"
        className="fixed bottom-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg animate-pulse"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 shadow-lg">
      <RefreshCw className="h-4 w-4 shrink-0 text-primary" />
      <p className="text-sm text-foreground">Hay una versión nueva</p>
      <Button size="sm" onClick={handleUpdate} disabled={updating}>
        {updating ? "Actualizando…" : "Actualizar"}
      </Button>
      {/* Minimizar, no cerrar -- pediste que no se pueda descartar
          permanentemente. Sin botón de cierre real a propósito. */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Minimizar aviso"
        onClick={() => setMinimized(true)}
        disabled={updating}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
