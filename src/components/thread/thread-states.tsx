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

export function ThreadEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <MessageCircle className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Todavía no hay mensajes con este lead.</p>
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
