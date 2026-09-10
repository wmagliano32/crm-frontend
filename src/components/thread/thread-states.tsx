import { MessageCircle, RefreshCw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function ThreadSkeleton() {
  return (
    <div className="flex flex-1 flex-col justify-end gap-3 p-4">
      {[false, true, false, false, true].map((isOut, i) => (
        <div key={i} className={cn("flex", isOut ? "justify-end" : "justify-start")}>
          <Skeleton className={cn("h-10 rounded-2xl", isOut ? "w-40" : "w-56")} />
        </div>
      ))}
    </div>
  )
}

// Fase 3.7: un hilo vacío ya no es siempre lo mismo. Con la alta manual (y
// con los clientes importados de la 2.13) hay leads que EXISTEN sin que
// nadie haya escrito nunca, y ahí "Todavía no hay mensajes" no alcanza: no
// explica por qué la caja de abajo no deja escribir. Las tres cosas que el
// operador necesita saber son que el lead nunca escribió, que por eso la
// ventana de 24h de WhatsApp está cerrada, y que el primer contacto sale
// solo por plantilla.
//
// La ACCIÓN no se duplica acá a propósito: el cartel de ventana cerrada del
// composer (ThreadComposer → HandoffPrompt / TemplateComposer) ya es el
// único lugar desde donde se manda una plantilla, y tener dos botones que
// hacen lo mismo en la misma pantalla sería peor que señalar el que ya
// está.
export function ThreadEmpty({ neverWrote = false }: { neverWrote?: boolean }) {
  if (!neverWrote) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <MessageCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Todavía no hay mensajes con este lead.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <MessageCircle className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">Este lead nunca escribió.</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        No hay conversación previa: entró cargado a mano o importado, no por WhatsApp. Por eso la
        ventana de 24h está cerrada — el primer contacto solo puede salir con una plantilla
        aprobada, desde el cartel de abajo.
      </p>
    </div>
  )
}

export function ThreadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <TriangleAlert className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">No se pudo cargar la conversación.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5" />
        Reintentar
      </Button>
    </div>
  )
}
