import type { ThreadMessage } from "@/lib/types"

// Convención implícita del orchestrator (sales_ai/services/orchestrator.py
// _log_message), NO un campo del modelo: el bot nunca setea payload.source
// al loguear un OUT. Los mensajes mandados por un humano desde el inbox
// (ConversationViewSet.send_message / send_template, o el link de
// reunión en LeadViewSet) siempre setean payload.source === "inbox".
// Confirmado contra producción (Fase 2.2, Paso 0). Si el día de mañana se
// agrega una forma nueva de mandar un OUT sin setear este source, este
// chequeo va a clasificarlo como bot por error — no romper esta convención
// sin actualizar acá también.
export function isHumanOutbound(message: ThreadMessage): boolean {
  return message.payload?.source === "inbox"
}

const TIME_FORMATTER = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" })

export function formatMessageTime(iso: string): string {
  return TIME_FORMATTER.format(new Date(iso))
}

export function isSameCalendarDay(isoA: string, isoB: string): boolean {
  const a = new Date(isoA)
  const b = new Date(isoB)
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const LONG_DATE_FORMATTER_SAME_YEAR = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" })
const LONG_DATE_FORMATTER_OTHER_YEAR = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" })

// Separador de día dentro de la MISMA conversación (WhatsApp-style: "Hoy",
// "Ayer", o la fecha completa).
export function formatDaySeparator(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  if (isSameCalendarDay(iso, now.toISOString())) return "Hoy"
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameCalendarDay(iso, yesterday.toISOString())) return "Ayer"
  const formatter = date.getFullYear() === now.getFullYear() ? LONG_DATE_FORMATTER_SAME_YEAR : LONG_DATE_FORMATTER_OTHER_YEAR
  return formatter.format(date)
}

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" })

function formatShortDate(iso: string): string {
  return SHORT_DATE_FORMATTER.format(new Date(iso))
}

function formatDurationEs(ms: number): string {
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `${minutes} minuto${minutes === 1 ? "" : "s"}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hora${hours === 1 ? "" : "s"}`
  const days = Math.round(hours / 24)
  return `${days} día${days === 1 ? "" : "s"}`
}

// Separador entre conversaciones distintas del mismo lead (Fase 2.2): el
// backend crea una conversación nueva cada SALES_CONVERSATION_RESET_HOURS
// de silencio, pero el corte se calcula acá directamente de los
// timestamps reales, no asumiendo esas 48h — gapMs es la diferencia entre
// el último mensaje de la conversación anterior y el primero de esta.
export function formatReengagementLabel(gapMs: number, newConversationStartIso: string): string {
  return `Reenganche · ${formatShortDate(newConversationStartIso)} · ${formatDurationEs(gapMs)} de silencio`
}

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  queued: "Enviando",
  sent: "Enviado",
  delivered: "Entregado",
  read: "Leído",
  failed: "Falló",
}

export function deliveryStatusLabel(status: string): string {
  return DELIVERY_STATUS_LABEL[status] ?? status
}
