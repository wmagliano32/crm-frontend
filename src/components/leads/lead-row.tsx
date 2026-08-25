import { BadgeCheck, StickyNote, UserRoundX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { LeadActionsMenu } from "@/components/leads/lead-actions-menu"
import {
  ageColorClass,
  attachmentPreviewLabel,
  displayNameFor,
  etiquetaLabel,
  formatRelativeTime,
  initialsFor,
  motivoPerdidaLabel,
  stageColorClass,
} from "@/lib/lead-format"
import type { Lead } from "@/lib/types"
import { cn } from "@/lib/utils"

// Fase 2.8: isArchived viene del padre (calculado por la tab activa, ver
// bandeja-page.tsx), no de un campo propio del lead en esta lista — en
// Pendientes/Míos/Todos nunca hay un lead archivado (el scope los saca a
// todos), en Archivados siempre lo hay, así que no hace falta pedirlo por
// lead.
export function LeadRow({
  lead,
  isSelected,
  isArchived,
  onClick,
}: {
  lead: Lead
  isSelected?: boolean
  isArchived: boolean
  onClick?: () => void
}) {
  const name = displayNameFor(lead)
  // Fase 3.1, diseño aprobado: el punto azul de "esperando respuesta" se
  // apaga también cuando la conversación se marcó resuelta a mano (no
  // solo cuando el contacto deja de ser el último en hablar) -- el caso
  // del "gracias" que motivó esto.
  const isPending = lead.last_message_direction === "IN" && lead.resuelto_at === null
  // Defensivo: si el backend desplegado todavía no tiene el fix del
  // serializer (Fase 2.1, Paso 0), este campo viene undefined en vez de [].
  const etiquetas = lead.etiquetas_seguimiento ?? []
  // Fase 2.8: un lead CLOSED por "marcar como perdido" sigue en Todos,
  // mostrando el motivo en vez del último mensaje — es lo único que
  // distingue "perdido con motivo" de cualquier otro CLOSED viejo.
  const lostReason = lead.stage === "CLOSED" ? motivoPerdidaLabel(lead.motivo_perdida) : ""

  return (
    // role="button", no <button>: el menú de acciones de abajo también
    // es un botón (radix DropdownMenuTrigger) — un <button> anidado
    // dentro de otro es HTML inválido y rompe el click del menú en
    // algunos navegadores.
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.()
        }
      }}
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 border-b border-border px-3 py-3 text-left hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring",
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
          {/* Fase 2.11: "no leído" es un indicador distinto del punto azul
              de arriba ("esperando respuesta") — negrita, mismo criterio
              visual que WhatsApp/Gmail. Fase 3.1: se suma el badge con
              conteo (más abajo) como refuerzo del mismo indicador de "no
              leído" (bold + badge, no dos conceptos distintos) — sigue
              sin competir con el punto azul, que es una señal aparte y
              puede estar prendida o apagada en cualquier combinación con
              esta (leído sin responder, o no leído pero ya resuelto). */}
          <p className={cn("truncate text-sm", lead.unread ? "font-bold" : "font-medium")}>{name}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Antigüedad medida desde el último mensaje DEL LEAD
                (last_inbound_at), no desde el último mensaje cualquiera: si
                el bot le escribió hace 3 días pero el lead no habla hace 4
                meses, lo que importa son los 4 meses. */}
            <span className={`text-xs ${ageColorClass(lead.last_inbound_at)}`}>
              {formatRelativeTime(lead.last_inbound_at)}
            </span>
            {/* Fase 3.1, diseño aprobado: badge tipo WhatsApp en el espacio
                que antes quedaba vacío al lado del nombre -- usa el
                CONTEO real (unread_message_count), no un booleano, así
                que si no hay número no se muestra nada (evita un círculo
                vacío que parezca contador y no cuente, pedido explícito).
                Verde a propósito, distinto del punto azul de abajo -- son
                dos señales distintas (no leído vs. esperando respuesta) y
                pueden estar prendidas a la vez (leído sin responder, o no
                leído pero ya resuelto), así que no pueden compartir color
                ni posición: este va en la fila, el punto sigue en la
                esquina del avatar. */}
            {lead.unread_message_count > 0 && (
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold leading-none text-white dark:bg-emerald-500"
                title={`${lead.unread_message_count} mensaje${lead.unread_message_count === 1 ? "" : "s"} sin leer`}
              >
                {lead.unread_message_count > 99 ? "99+" : lead.unread_message_count}
              </span>
            )}
          </div>
        </div>

        {lostReason ? (
          <p className="truncate text-sm text-muted-foreground">Perdido — {lostReason}</p>
        ) : lead.last_inbound_text ? (
          <p className={cn("truncate text-sm", lead.unread ? "font-semibold text-foreground" : "text-muted-foreground")}>
            {lead.last_inbound_text}
          </p>
        ) : lead.last_inbound_at ? (
          // Fase 3.4 (hallazgo en producción): last_inbound_text vacío
          // con last_inbound_at seteado significa que SÍ respondió, pero
          // con un adjunto sin caption -- no es lo mismo que "nunca
          // escribió", así que no puede compartir el texto de abajo.
          <p className={cn("truncate text-sm", lead.unread ? "font-semibold text-foreground" : "text-muted-foreground")}>
            {attachmentPreviewLabel(lead.last_inbound_attachment_type)}
          </p>
        ) : (
          <p className="truncate text-sm italic text-muted-foreground/60">Sin respuesta del lead</p>
        )}

        {(etiquetas.length > 0 || lead.notes_count > 0) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {/* Fase 3.2, diseño aprobado: indicador de que hay contexto
                guardado, sin abrir el hilo -- color neutro a propósito,
                para no competir con el verde de no-leídos ni el azul de
                "esperando respuesta" (es informativo, no urgente). */}
            {lead.notes_count > 0 && (
              <span
                className="flex items-center gap-1 rounded-full bg-muted px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
                title={`${lead.notes_count} nota${lead.notes_count === 1 ? "" : "s"} interna${lead.notes_count === 1 ? "" : "s"}`}
              >
                <StickyNote className="h-3 w-3" />
                {lead.notes_count}
              </span>
            )}
            {etiquetas.map((etiqueta) => (
              <Badge key={etiqueta} variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                {etiquetaLabel(etiqueta)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
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
        <LeadActionsMenu leadId={lead.id} leadName={name} stage={lead.stage} isArchived={isArchived} />
      </div>
    </div>
  )
}
