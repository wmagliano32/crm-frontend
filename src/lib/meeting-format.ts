import type { MeetingDisplayStatus } from "@/lib/types"

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

export function formatMeetingDateTime(iso: string): string {
  const label = DATE_TIME_FORMATTER.format(new Date(iso))
  // Intl en es-AR devuelve "lun, 24 ago, 10:30" — se saca la coma después
  // del día de semana para que quede "lun 24 ago, 10:30", más compacto.
  return label.replace(/^(\w+),/, "$1")
}

// display_status ya viene resuelto del backend (Fase 2.12, ver
// MeetingCalendarSerializer.get_display_status) — acá solo se traduce a
// texto/color, mismo criterio que stageLabel/etiquetaLabel.
const STATUS_LABEL: Record<MeetingDisplayStatus, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  DONE: "Realizada",
  CANCELLED: "Cancelada",
}

export function meetingStatusLabel(status: MeetingDisplayStatus): string {
  return STATUS_LABEL[status]
}

export function meetingStatusColorClass(status: MeetingDisplayStatus): string {
  switch (status) {
    case "CONFIRMED":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    case "SCHEDULED":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
    case "DONE":
      return "bg-muted text-muted-foreground"
    case "CANCELLED":
      return "bg-destructive/10 text-destructive"
  }
}
