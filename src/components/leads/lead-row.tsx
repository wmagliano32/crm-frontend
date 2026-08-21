import { BadgeCheck, UserRoundX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ageColorClass, displayNameFor, etiquetaLabel, formatRelativeTime, initialsFor, stageColorClass } from "@/lib/lead-format"
import type { Lead } from "@/lib/types"
import { cn } from "@/lib/utils"

export function LeadRow({ lead, isSelected, onClick }: { lead: Lead; isSelected?: boolean; onClick?: () => void }) {
  const name = displayNameFor(lead)
  const isPending = lead.last_message_direction === "IN"
  // Defensivo: si el backend desplegado todavía no tiene el fix del
  // serializer (Fase 2.1, Paso 0), este campo viene undefined en vez de [].
  const etiquetas = lead.etiquetas_seguimiento ?? []

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 border-b border-border px-3 py-3 text-left hover:bg-muted/60",
        isSelected && "bg-muted"
      )}
    >
      <div className="relative shrink-0">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white ${stageColorClass(lead.stage)}`}
          aria-hidden
        >
          {initialsFor(name)}
        </div>
        {isPending && (
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-background"
            title="Esperando respuesta"
          />
        )}
        {/* Discreto a propósito (Fase 2.6): un ícono chico en el borde del
            avatar, no una pill de texto — para que un cliente se distinga
            de un vistazo si alguna vez se mezclan con prospectos, sin
            competir con las etiquetas de seguimiento. */}
        {lead.es_cliente && (
          <span
            className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background"
            title="Cliente"
          >
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" aria-hidden />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium">{name}</p>
          {/* Antigüedad medida desde el último mensaje DEL LEAD
              (last_inbound_at), no desde el último mensaje cualquiera: si el
              bot le escribió hace 3 días pero el lead no habla hace 4 meses,
              lo que importa son los 4 meses. */}
          <span className={`shrink-0 text-xs ${ageColorClass(lead.last_inbound_at)}`}>
            {formatRelativeTime(lead.last_inbound_at)}
          </span>
        </div>

        {lead.last_inbound_text ? (
          <p className="truncate text-sm text-muted-foreground">{lead.last_inbound_text}</p>
        ) : (
          <p className="truncate text-sm italic text-muted-foreground/60">Sin respuesta del lead</p>
        )}

        {etiquetas.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {etiquetas.map((etiqueta) => (
              <Badge key={etiqueta} variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                {etiquetaLabel(etiqueta)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 pt-0.5">
        {lead.assigned_to_name ? (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground"
            title={lead.assigned_to_name}
          >
            {initialsFor(lead.assigned_to_name)}
          </div>
        ) : (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground"
            title="Sin asignar"
          >
            <UserRoundX className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </button>
  )
}
