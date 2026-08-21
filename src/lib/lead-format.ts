import type { LeadStage } from "@/lib/types"

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

const ETIQUETA_LABEL: Record<string, string> = {
  RESPONDER_HOY: "Responder hoy",
  ESPERANDO_CLIENTE: "Esperando cliente",
  PIDIO_PRECIO: "Pidió precio",
  DEMO_AGENDADA: "Demo agendada",
  TRABADO: "Trabado",
  SIN_DATOS: "Sin datos",
}

export function etiquetaLabel(etiqueta: string): string {
  return ETIQUETA_LABEL[etiqueta] ?? etiqueta
}
