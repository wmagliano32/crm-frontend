import { ChevronUp, Loader2 } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"
import { ThreadMessageRun } from "@/components/thread/thread-message-bubble"
import { ThreadComposer } from "@/components/thread/thread-composer"
import { ThreadHeader } from "@/components/thread/thread-header"
import { ThreadPendingBubble } from "@/components/thread/thread-pending-bubble"
import { ThreadSeparator } from "@/components/thread/thread-separator"
import { ThreadEmpty, ThreadError, ThreadSkeleton } from "@/components/thread/thread-states"
import { Button } from "@/components/ui/button"
import { useLeadThread } from "@/hooks/use-lead-thread"
import { useLead } from "@/hooks/use-leads"
import { useNow } from "@/hooks/use-now"
import { useSendMessage } from "@/hooks/use-send-message"
import { isHumanOutbound, isSameCalendarDay } from "@/lib/thread-format"
import { formatDaySeparator, formatReengagementLabel } from "@/lib/thread-format"
import type { ThreadMessage } from "@/lib/types"

type ThreadItem =
  | { type: "separator"; key: string; label: string; muted: boolean }
  | { type: "run"; key: string; messages: ThreadMessage[] }

// Identidad del emisor para agrupar en una "tanda": IN, bot y humano son
// tres emisores distintos aunque los dos últimos compartan direction=OUT.
function senderKeyFor(message: ThreadMessage): string {
  if (message.direction === "IN") return "IN"
  return isHumanOutbound(message) ? "OUT_HUMAN" : "OUT_BOT"
}

// Arma la lista intercalando separadores y agrupando en tandas (Fase 2.2,
// ajuste tras ver datos reales: separar CADA mensaje dejaba huecos
// verticales grandes, sobre todo por la etiqueta "Bot" en línea propia).
// Separador de fecha en cambios de día dentro de la MISMA conversación, y
// de "reenganche" (con la fecha ya incluida) en cada cambio de
// conversación — así no se duplican los dos uno arriba del otro. Un
// separador SIEMPRE corta la tanda en curso, aunque el emisor no haya
// cambiado: agrupar mensajes de días o conversaciones distintas bajo una
// sola hora no tendría sentido. Si la conversación a la que se entra está
// eliminada, el separador de esa entrada se marca "muted" y suma la
// aclaración.
function buildThreadItems(messagesAsc: ThreadMessage[]): ThreadItem[] {
  const items: ThreadItem[] = []
  let prev: ThreadMessage | null = null
  let currentRun: ThreadMessage[] | null = null

  function flushRun() {
    if (!currentRun) return
    items.push({ type: "run", key: `run-${currentRun[0].id}`, messages: currentRun })
    currentRun = null
  }

  for (const msg of messagesAsc) {
    const conversationChanged = prev !== null && msg.conversation !== prev.conversation
    const enteringDeleted = msg.conversacion_eliminada && (prev === null || prev.conversation !== msg.conversation)
    const deletedSuffix = enteringDeleted ? " · conversación eliminada" : ""
    const dayChanged = prev === null || !isSameCalendarDay(prev.created_at, msg.created_at)
    const needsSeparator = conversationChanged || dayChanged

    if (needsSeparator) {
      flushRun()
      if (conversationChanged) {
        const gapMs = new Date(msg.created_at).getTime() - new Date(prev!.created_at).getTime()
        items.push({
          type: "separator",
          key: `sep-${msg.id}`,
          label: `${formatReengagementLabel(gapMs, msg.created_at)}${deletedSuffix}`,
          muted: enteringDeleted,
        })
      } else {
        items.push({
          type: "separator",
          key: `sep-${msg.id}`,
          label: `${formatDaySeparator(msg.created_at)}${deletedSuffix}`,
          muted: enteringDeleted,
        })
      }
    }

    if (!needsSeparator && currentRun && senderKeyFor(currentRun[0]) === senderKeyFor(msg)) {
      currentRun.push(msg)
    } else {
      flushRun()
      currentRun = [msg]
    }
    prev = msg
  }
  flushRun()
  return items
}

export function LeadThreadPanel({ leadId, onBack }: { leadId: number; onBack: () => void }) {
  const thread = useLeadThread(leadId)
  const { data: lead } = useLead(leadId)
  const now = useNow()
  const { pending, send, sendTemplate, retry, dismiss } = useSendMessage(leadId)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef<number | null>(null)
  const pendingCountRef = useRef(0)

  const messagesAsc = useMemo(() => {
    // Cada página viene más-reciente-primero y las páginas se piden de más
    // nueva a más vieja, así que concatenarlas en orden de llegada ya da
    // la lista global descendente; se invierte una sola vez acá para
    // mostrarla ascendente (viejo arriba, nuevo abajo, como WhatsApp).
    const pages = thread.data?.pages ?? []
    return pages.flatMap((page) => page.results).reverse()
  }, [thread.data])

  const items = useMemo(() => buildThreadItems(messagesAsc), [messagesAsc])

  // Al entrar a un lead (o volver a uno ya con datos en caché), arrancar
  // abajo del todo, como WhatsApp.
  useEffect(() => {
    if (!thread.isLoading && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, thread.isLoading])

  // Al cargar mensajes más viejos (prepend arriba), mantener la posición
  // relativa de lo que el usuario ya estaba viendo en vez de saltar.
  useEffect(() => {
    if (prevScrollHeightRef.current !== null && containerRef.current) {
      const el = containerRef.current
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current
      prevScrollHeightRef.current = null
    }
  }, [thread.data?.pages.length])

  // Un mensaje propio recién mandado siempre lleva la vista al final —
  // distinto del caso de arriba (cargar viejos), acá el usuario acaba de
  // generar el contenido nuevo, tiene sentido mostrárselo sin que tenga
  // que scrollear.
  useEffect(() => {
    if (pending.length > pendingCountRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
    pendingCountRef.current = pending.length
  }, [pending.length])

  const handleLoadOlder = () => {
    if (containerRef.current) {
      prevScrollHeightRef.current = containerRef.current.scrollHeight
    }
    thread.fetchNextPage()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ThreadHeader leadId={leadId} onBack={onBack} />

      <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-3">
        {thread.isLoading ? (
          <ThreadSkeleton />
        ) : thread.isError ? (
          <ThreadError onRetry={() => thread.refetch()} />
        ) : (
          <>
            {thread.hasNextPage && (
              <div className="flex justify-center pb-3">
                <Button variant="outline" size="sm" onClick={handleLoadOlder} disabled={thread.isFetchingNextPage}>
                  {thread.isFetchingNextPage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5" />
                  )}
                  Cargar anteriores
                </Button>
              </div>
            )}
            {items.length === 0 && pending.length === 0 ? (
              <ThreadEmpty />
            ) : (
              <div className="flex flex-col gap-1">
                {items.map((item) =>
                  item.type === "separator" ? (
                    <ThreadSeparator key={item.key} label={item.label} muted={item.muted} />
                  ) : (
                    <ThreadMessageRun key={item.key} messages={item.messages} />
                  )
                )}
                {pending.map((p) => (
                  <ThreadPendingBubble key={p.localId} pending={p} onRetry={retry} onDismiss={dismiss} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {lead && <ThreadComposer lead={lead} now={now} onSend={send} onSendTemplate={sendTemplate} />}
    </div>
  )
}
