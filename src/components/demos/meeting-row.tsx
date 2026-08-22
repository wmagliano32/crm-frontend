import { CalendarClock, ExternalLink } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { CancelMeetingDialog } from "@/components/demos/cancel-meeting-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRetryMeetingLink, useSetMeetingLink } from "@/hooks/use-meetings"
import { formatMeetingDateTime, meetingStatusColorClass, meetingStatusLabel } from "@/lib/meeting-format"
import type { Meeting } from "@/lib/types"

// Fase 2.12, decisión aprobada: "sin link" solo importa para demos que
// todavía van a pasar — una realizada o cancelada sin link ya no le
// sirve a nadie, no tiene sentido ofrecer reintentar/pegar.
function isActionable(meeting: Meeting): boolean {
  return meeting.display_status === "SCHEDULED" || meeting.display_status === "CONFIRMED"
}

export function MeetingRow({ meeting }: { meeting: Meeting }) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkValue, setLinkValue] = useState("")
  const [linkError, setLinkError] = useState<string | null>(null)
  const retryMutation = useRetryMeetingLink()
  const setLinkMutation = useSetMeetingLink()

  const hasLink = Boolean(meeting.meeting_url)
  const canManageLink = isActionable(meeting) && !hasLink

  function handleSaveLink(e: React.FormEvent) {
    e.preventDefault()
    setLinkError(null)
    setLinkMutation.mutate(
      { meetingId: meeting.id, meetingUrl: linkValue },
      {
        onSuccess: () => {
          setShowLinkInput(false)
          setLinkValue("")
        },
        onError: () => setLinkError("No se pudo guardar el link. ¿Es una URL válida?"),
      }
    )
  }

  return (
    <div className="flex flex-col gap-2 border-b border-border px-3 py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/bandeja/${meeting.lead.id}`} className="truncate text-sm font-medium hover:underline">
            {meeting.lead.name || meeting.lead.phone_e164}
          </Link>
          <Badge variant="outline" className={meetingStatusColorClass(meeting.display_status)}>
            {meetingStatusLabel(meeting.display_status)}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatMeetingDateTime(meeting.scheduled_at)}</p>

        {hasLink ? (
          <a
            href={meeting.meeting_url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {meeting.meeting_url}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : canManageLink ? (
          <div className="mt-1.5 flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-amber-600 dark:text-amber-400">Sin link de Meet</span>
              <Button size="xs" variant="outline" onClick={() => retryMutation.mutate(meeting.id)} disabled={retryMutation.isPending}>
                {retryMutation.isPending ? "Reintentando…" : "Reintentar"}
              </Button>
              <Button size="xs" variant="outline" onClick={() => setShowLinkInput((v) => !v)}>
                Pegar link
              </Button>
            </div>
            {showLinkInput && (
              <form onSubmit={handleSaveLink} className="flex gap-1.5">
                <Input
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                  placeholder="https://meet.google.com/…"
                  className="h-7 text-xs"
                  autoFocus
                />
                <Button size="xs" type="submit" disabled={setLinkMutation.isPending}>
                  Guardar
                </Button>
              </form>
            )}
            {linkError && <p className="text-xs text-destructive">{linkError}</p>}
            {retryMutation.isSuccess && !hasLink && (
              <p className="text-xs text-muted-foreground">Reintento en camino, puede tardar unos minutos.</p>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {meeting.event_html_link && (
          <Button size="sm" variant="ghost" asChild>
            <a href={meeting.event_html_link} target="_blank" rel="noreferrer">
              <CalendarClock className="h-3.5 w-3.5" />
              Ver en Calendar
            </a>
          </Button>
        )}
        {isActionable(meeting) && <CancelMeetingDialog meeting={meeting} />}
      </div>
    </div>
  )
}
