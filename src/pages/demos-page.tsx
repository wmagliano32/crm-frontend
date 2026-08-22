import { useMemo } from "react"
import { MeetingRow } from "@/components/demos/meeting-row"
import { Skeleton } from "@/components/ui/skeleton"
import { useMeetings } from "@/hooks/use-meetings"
import type { Meeting } from "@/lib/types"

function isUpcoming(meeting: Meeting): boolean {
  return meeting.display_status === "SCHEDULED" || meeting.display_status === "CONFIRMED"
}

export function DemosPage() {
  const { data: meetings, isLoading, isError, refetch } = useMeetings()

  const { upcoming, past } = useMemo(() => {
    const all = meetings ?? []
    const upcomingList = all.filter(isUpcoming).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    const pastList = all.filter((m) => !isUpcoming(m)).sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))
    return { upcoming: upcomingList, past: pastList }
  }, [meetings])

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col overflow-y-auto">
      <div className="shrink-0 border-b border-border px-3 py-3">
        <h1 className="text-base font-semibold">Demos</h1>
        <p className="text-xs text-muted-foreground">Próximas demos y su link de Meet, ordenadas por fecha.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 p-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
          <p>No se pudieron cargar las demos.</p>
          <button type="button" onClick={() => refetch()} className="text-primary hover:underline">
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <section>
            <h2 className="border-b border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Próximas
            </h2>
            {upcoming.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">No hay demos agendadas.</p>
            ) : (
              upcoming.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />)
            )}
          </section>

          <section>
            <h2 className="border-b border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Pasadas
            </h2>
            {past.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">Todavía no hay demos pasadas.</p>
            ) : (
              past.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />)
            )}
          </section>
        </>
      )}
    </div>
  )
}
