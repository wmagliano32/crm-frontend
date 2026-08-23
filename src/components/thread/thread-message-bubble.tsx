import { Bot } from "lucide-react"
import { useMemo } from "react"
import { ThreadAttachmentPreview } from "@/components/thread/thread-attachment-preview"
import { deliveryStatusLabel, formatMessageTime, isHumanOutbound } from "@/lib/thread-format"
import type { ThreadMessage } from "@/lib/types"
import { cn } from "@/lib/utils"

function minuteKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`
}

// Tanda de mensajes consecutivos del MISMO emisor (ver buildThreadItems en
// lead-thread-panel.tsx: el corte por conversación/día ya deja cada run
// homogéneo). Acá se subagrupan además por minuto: varios mensajes
// seguidos dentro del mismo minuto comparten una sola hora al final,
// en vez de repetirla bajo cada globo (Fase 2.2, ajuste tras ver datos
// reales — antes cada mensaje reservaba su propia línea de hora).
export function ThreadMessageRun({ messages }: { messages: ThreadMessage[] }) {
  const first = messages[0]
  const isOut = first.direction === "OUT"
  const isBot = isOut && !isHumanOutbound(first)

  const subgroups = useMemo(() => {
    const groups: ThreadMessage[][] = []
    for (const msg of messages) {
      const last = groups[groups.length - 1]
      if (last && minuteKey(last[0].created_at) === minuteKey(msg.created_at)) {
        last.push(msg)
      } else {
        groups.push([msg])
      }
    }
    return groups
  }, [messages])

  return (
    <div className={cn("flex", isOut ? "justify-end" : "justify-start", first.conversacion_eliminada && "opacity-50")}>
      <div className={cn("flex min-w-0 max-w-[min(65%,600px)] flex-col gap-0.5", isOut ? "items-end" : "items-start")}>
        {subgroups.map((group, groupIndex) => {
          const last = group[group.length - 1]
          return (
            <div key={group[0].id} className="flex flex-col gap-0.5">
              {group.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    // wrap-anywhere (overflow-wrap:anywhere), no solo
                    // break-words (overflow-wrap:break-word): break-word
                    // no reduce el min-content en contextos flex, así que
                    // una URL sin espacios sigue empujando el ancho del
                    // globo/contenedor aunque visualmente "wrapee" (Bug 2).
                    "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap wrap-anywhere",
                    !isOut && "rounded-bl-sm bg-muted text-foreground",
                    isOut && isBot && "rounded-br-sm bg-primary/10 text-foreground",
                    isOut && !isBot && "rounded-br-sm bg-primary text-primary-foreground"
                  )}
                >
                  {message.text}
                  {message.attachments.length > 0 && (
                    <div className={cn("flex min-w-0 flex-col gap-1.5", message.text && "mt-1.5")}>
                      {message.attachments.map((attachment) => (
                        <ThreadAttachmentPreview key={attachment.id} attachment={attachment} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <span className="flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
                {groupIndex === 0 && isBot && (
                  <span className="flex items-center gap-0.5 font-medium">
                    <Bot className="h-3 w-3" />
                    Bot ·
                  </span>
                )}
                {formatMessageTime(last.created_at)}
                {isOut && last.delivery_status && ` · ${deliveryStatusLabel(last.delivery_status)}`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
