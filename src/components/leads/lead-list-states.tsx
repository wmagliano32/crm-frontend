import { Inbox, RefreshCw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LeadListEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function LeadListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <TriangleAlert className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">No se pudo cargar la bandeja. Revisá tu conexión.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5" />
        Reintentar
      </Button>
    </div>
  )
}
