// Ventana de 24h de WhatsApp: mientras esté abierta se puede mandar texto
// libre; cerrada, solo plantillas aprobadas. El backend NO valida esto
// antes de llamar a Twilio (confirmado en Paso 0 de la Fase 2.3) — recién
// se entera después, vía el error 63016 de Twilio. Por eso el gate tiene
// que vivir acá: dejar escribir un mensaje largo para que falle recién al
// mandarlo es la razón número uno por la que se abandonan estas bandejas.
//
// Se calcula desde Lead.last_inbound_at, no desde Conversation.last_user_message_at
// (que sugería el pedido original): last_inbound_at es el campo que se
// auditó y backfilleó en la Fase 2.2 por un bug de persistencia — es la
// fuente confiable. Conceptualmente además la ventana es sobre el último
// mensaje de LA PERSONA, no de una conversación puntual entre varias.
const WINDOW_HOURS = 24
const WINDOW_MS = WINDOW_HOURS * 60 * 60 * 1000

export interface WindowStatus {
  isOpen: boolean
  label: string
}

function formatClockDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function formatElapsedCasual(ms: number): string {
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `${minutes} minuto${minutes === 1 ? "" : "s"}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hora${hours === 1 ? "" : "s"}`
  const days = Math.round(hours / 24)
  return `${days} día${days === 1 ? "" : "s"}`
}

export function computeWindowStatus(lastInboundAt: string | null, now: Date = new Date()): WindowStatus {
  if (!lastInboundAt) {
    return { isOpen: false, label: "Ventana cerrada: este lead todavía no escribió" }
  }
  const closesAt = new Date(lastInboundAt).getTime() + WINDOW_MS
  const remaining = closesAt - now.getTime()
  if (remaining > 0) {
    return { isOpen: true, label: `Ventana abierta · cierra en ${formatClockDuration(remaining)}` }
  }
  return { isOpen: false, label: `Ventana cerrada hace ${formatElapsedCasual(-remaining)}` }
}
