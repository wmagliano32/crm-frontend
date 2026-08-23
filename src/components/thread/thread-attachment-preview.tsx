import { FileText, Paperclip } from "lucide-react"
import { useState } from "react"
import { formatFileSize } from "@/lib/thread-format"
import type { MessageAttachment } from "@/lib/types"

// Fase 2.10: adjuntos ENTRANTES no tienen whitelist (Frente 1, backend) —
// clasificar acá por prefijo de content_type, nunca contra la lista de
// tipos permitidos para SALIENTES (attachment-limits.ts), que es una
// whitelist de envío, no de render.
function GenericAttachment({ attachment, Icon }: { attachment: MessageAttachment; Icon: typeof Paperclip }) {
  return (
    <a
      href={attachment.download_url}
      target="_blank"
      rel="noreferrer"
      className="flex min-w-0 items-center gap-1.5 rounded-md border border-current/20 bg-background/40 px-2 py-1.5 text-xs underline-offset-2 hover:underline"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{attachment.file_name || "Adjunto"}</span>
      <span className="shrink-0 text-muted-foreground">{formatFileSize(attachment.size_bytes)}</span>
    </a>
  )
}

function ImageAttachment({ attachment }: { attachment: MessageAttachment }) {
  const [broken, setBroken] = useState(false)
  if (broken) return <GenericAttachment attachment={attachment} Icon={Paperclip} />
  return (
    <a href={attachment.download_url} target="_blank" rel="noreferrer" className="block min-w-0 max-w-full">
      <img
        src={attachment.download_url}
        alt={attachment.file_name || "Imagen adjunta"}
        loading="lazy"
        onError={() => setBroken(true)}
        className="max-h-64 w-auto max-w-full rounded-lg object-cover"
      />
    </a>
  )
}

export function ThreadAttachmentPreview({ attachment }: { attachment: MessageAttachment }) {
  const contentType = attachment.content_type || ""

  if (contentType.startsWith("image/")) {
    return <ImageAttachment attachment={attachment} />
  }

  if (contentType.startsWith("video/")) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video controls preload="metadata" className="max-h-64 w-full min-w-0 max-w-full rounded-lg">
        <source src={attachment.download_url} type={contentType} />
      </video>
    )
  }

  if (contentType.startsWith("audio/")) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <audio controls preload="metadata" className="w-full min-w-0 max-w-full">
        <source src={attachment.download_url} type={contentType} />
      </audio>
    )
  }

  const Icon = contentType === "application/pdf" ? FileText : Paperclip
  return <GenericAttachment attachment={attachment} Icon={Icon} />
}
