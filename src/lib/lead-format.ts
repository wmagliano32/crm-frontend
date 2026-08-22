import type { EtiquetaSeguimiento, LeadStage, MotivoPerdida } from "@/lib/types"

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return ""
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.round(diffMs / 60_000)
  if (diffMin < 1) return "ahora"
  if (diffMin < 60) return `${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH} h`
  const diffD = Math.round(diffH / 24)
  return `${diffD} d`
}

// Clase de color según antigüedad del último mensaje: un lead de 4 meses y
// uno de 2hs no pueden verse igual. < 24h resalta (recién pasó algo), 1-7d
// es el gris "normal" de antes, > 7d ámbar (se está enfriando), > 30d rojo
// (lead frío). Ordenar por más antiguo primero (como hace "Pendientes")
// deja los rojos arriba solo — no hace falta lógica de orden aparte.
export function ageColorClass(iso: string | null): string {
  if (!iso) return "text-muted-foreground"
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000
  if (hours < 24) return "text-foreground font-medium"
  if (hours <= 24 * 7) return "text-muted-foreground"
  if (hours <= 24 * 30) return "text-amber-600 dark:text-amber-500 font-medium"
  return "text-rose-600 dark:text-rose-500 font-semibold"
}

export function initialsFor(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return "?"
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Última línea de fallback cuando el lead no tiene nombre cargado.
export function displayNameFor(lead: { name: string; phone_e164: string }): string {
  return lead.name.trim() || lead.phone_e164
}

const STAGE_COLOR: Record<LeadStage, string> = {
  NEW: "bg-slate-400",
  QUALIFY: "bg-sky-500",
  PITCH: "bg-indigo-500",
  SCHEDULING: "bg-violet-500",
  BOOKED: "bg-emerald-500",
  HANDOFF: "bg-amber-500",
  OPTED_OUT: "bg-rose-500",
  CLOSED: "bg-zinc-400",
}

export function stageColorClass(stage: LeadStage): string {
  return STAGE_COLOR[stage] ?? "bg-slate-400"
}

const STAGE_LABEL: Record<LeadStage, string> = {
  NEW: "Nuevo",
  QUALIFY: "Calificando",
  PITCH: "Presentación",
  SCHEDULING: "Agendando",
  BOOKED: "Demo agendada",
  HANDOFF: "Handoff",
  OPTED_OUT: "Se dio de baja",
  CLOSED: "Cerrado",
}

export function stageLabel(stage: LeadStage): string {
  return STAGE_LABEL[stage] ?? stage
}

const ETIQUETA_LABEL: Record<EtiquetaSeguimiento, string> = {
  RESPONDER_HOY: "Responder hoy",
  ESPERANDO_CLIENTE: "Esperando cliente",
  PIDIO_PRECIO: "Pidió precio",
  DEMO_AGENDADA: "Demo agendada",
  TRABADO: "Trabado",
  SIN_DATOS: "Sin datos",
}

// Vocabulario cerrado completo, en el orden en que se ofrecen para
// agregar (sales_ai.models.EtiquetaSeguimiento en el backend).
export const ALL_ETIQUETAS = Object.keys(ETIQUETA_LABEL) as EtiquetaSeguimiento[]

export function etiquetaLabel(etiqueta: string): string {
  return ETIQUETA_LABEL[etiqueta as EtiquetaSeguimiento] ?? etiqueta
}

const MOTIVO_PERDIDA_LABEL: Record<MotivoPerdida, string> = {
  PRECIO: "Precio",
  COMPETENCIA: "Competencia",
  MUY_CHICO: "Consorcio muy chico",
  NO_RESPONDIO: "No respondió",
  NO_ERA_EL_MOMENTO: "No era el momento",
  OTRO: "Otro",
}

// Orden en que se ofrecen en el selector de "Marcar como perdido"
// (sales_ai.models.MotivoPerdida en el backend).
export const ALL_MOTIVOS_PERDIDA = Object.keys(MOTIVO_PERDIDA_LABEL) as MotivoPerdida[]

export function motivoPerdidaLabel(motivo: MotivoPerdida | null): string {
  if (!motivo) return ""
  return MOTIVO_PERDIDA_LABEL[motivo] ?? motivo
}
