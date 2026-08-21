import { Loader2, TriangleAlert, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PendingMessage } from "@/hooks/use-send-message"

export function ThreadPendingBubble({
  pending,
  onRetry,
  onDismiss,
}: {
  pending: PendingMessage
  onRetry: (localId: string) => void
  onDismiss: (localId: string) => void
}) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[min(65%,600px)] flex-col items-end gap-0.5">
        <div
          className="rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm whitespace-pre-wrap break-words text-primary-foreground opacity-80"
        >
          {pending.text}
        </div>
        {pending.status === "sending" ? (
          <span className="flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            Enviando…
          </span>
        ) : (
          <div className="flex items-center gap-1.5 px-1 text-[10px] text-destructive">
            <TriangleAlert className="h-3 w-3 shrink-0" />
            <span>{pending.errorReason}</span>
            <Button
              variant="ghost"
              size="xs"
              className="h-4 px-1 text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onRetry(pending.localId)}
            >
              Reintentar
            </Button>
            <button
              type="button"
              onClick={() => onDismiss(pending.localId)}
              aria-label="Descartar"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
