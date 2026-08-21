import { Bot, Paperclip } from "lucide-react"
import { deliveryStatusLabel, formatMessageTime, isHumanOutbound } from "@/lib/thread-format"
import type { ThreadMessage } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ThreadMessageBubble({ message }: { message: ThreadMessage }) {
  const isOut = message.direction === "OUT"
  const isBot = isOut && !isHumanOutbound(message)

  return (
    <div className={cn("flex", isOut ? "justify-end" : "justify-start", message.conversacion_eliminada && "opacity-50")}>
      <div className={cn("flex max-w-[80%] flex-col gap-1 sm:max-w-[65%]", isOut ? "items-end" : "items-start")}>
        {isBot && (
          <span className="flex items-center gap-1 px-1 text-[10px] font-medium text-muted-foreground">
            <Bot className="h-3 w-3" />
            Bot
          </span>
        )}
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
            !isOut && "rounded-bl-sm bg-muted text-foreground",
            isOut && isBot && "rounded-br-sm bg-primary/10 text-foreground",
            isOut && !isBot && "rounded-br-sm bg-primary text-primary-foreground"
          )}
        >
          {message.text}
          {message.attachments.length > 0 && (
            <div className="mt-1.5 flex flex-col gap-1">
              {message.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-md border border-current/20 bg-background/40 px-2 py-1 text-xs underline-offset-2 hover:underline"
                >
                  <Paperclip className="h-3 w-3 shrink-0" />
                  <span className="max-w-[200px] truncate">{attachment.file_name || "Adjunto"}</span>
                </a>
              ))}
            </div>
          )}
        </div>
        <span className="px-1 text-[10px] text-muted-foreground">
          {formatMessageTime(message.created_at)}
          {isOut && message.delivery_status && ` · ${deliveryStatusLabel(message.delivery_status)}`}
        </span>
      </div>
    </div>
  )
}
