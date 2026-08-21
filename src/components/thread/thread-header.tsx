import { ArrowLeft, Info, Plus, X } from "lucide-react"
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SelectNative } from "@/components/ui/select-native"
import { Skeleton } from "@/components/ui/skeleton"
import { useEmpleados } from "@/hooks/use-empleados"
import { useAssignConversation, useLeadEtiquetaMutation } from "@/hooks/use-lead-actions"
import { useNow } from "@/hooks/use-now"
import { useLead } from "@/hooks/use-leads"
import { ALL_ETIQUETAS, displayNameFor, etiquetaLabel, initialsFor, stageColorClass, stageLabel } from "@/lib/lead-format"
import type { EtiquetaSeguimiento } from "@/lib/types"
import { cn } from "@/lib/utils"
import { computeWindowStatus } from "@/lib/window-format"

export function ThreadHeader({ leadId, onBack }: { leadId: number; onBack: () => void }) {
  const { data: lead } = useLead(leadId)
  const { data: empleados } = useEmpleados()
  const assignMutation = useAssignConversation(leadId)
  const etiquetaMutation = useLeadEtiquetaMutation(leadId)
  const now = useNow()
  const navigate = useNavigate()
  const location = useLocation()
  const fichaOpen = location.pathname.endsWith("/ficha")
  const [etiquetasOpen, setEtiquetasOpen] = useState(false)

  const name = lead ? displayNameFor(lead) : "…"
  const activeEtiquetas = lead?.etiquetas_seguimiento ?? []
  const windowStatus = lead ? computeWindowStatus(lead.last_inbound_at, now) : null
  const canAssign = lead != null && lead.current_conversation_id !== null

  function handleAssignChange(rawValue: string) {
    if (!lead || lead.current_conversation_id === null) return
    const userId = rawValue === "" ? null : Number(rawValue)
    assignMutation.mutate({ conversationId: lead.current_conversation_id, userId })
  }

  function toggleEtiqueta(etiqueta: EtiquetaSeguimiento) {
    const action = activeEtiquetas.includes(etiqueta) ? "remove" : "add"
    etiquetaMutation.mutate({ etiqueta, action })
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-border px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="-ml-1 md:hidden" onClick={onBack} aria-label="Volver a la bandeja">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {lead ? (
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
              stageColorClass(lead.stage)
            )}
            aria-hidden
          >
            {initialsFor(name)}
          </div>
        ) : (
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          {lead && <p className="truncate text-xs text-muted-foreground">{lead.phone_e164}</p>}
        </div>
        {lead && (
          <Badge variant="outline" className="shrink-0">
            {stageLabel(lead.stage)}
          </Badge>
        )}
        <Button
          variant={fichaOpen ? "secondary" : "ghost"}
          size="icon"
          className="shrink-0"
          onClick={() => navigate(fichaOpen ? `/bandeja/${leadId}` : `/bandeja/${leadId}/ficha`)}
          aria-label="Ver ficha del lead"
          aria-pressed={fichaOpen}
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>

      {lead && windowStatus && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Contador de ventana de 24h — SIEMPRE visible, nunca escondido
              (pedido explícito): es lo que decide si la caja de envío deja
              escribir texto libre o solo plantillas. */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
              windowStatus.isOpen
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", windowStatus.isOpen ? "bg-emerald-500" : "bg-muted-foreground/50")} />
            {windowStatus.label}
          </span>

          <SelectNative
            className="ml-auto w-auto max-w-[170px]"
            value={lead.assigned_to_id ?? ""}
            disabled={!canAssign || assignMutation.isPending}
            onChange={(e) => handleAssignChange(e.target.value)}
            aria-label="Asignar conversación"
          >
            <option value="">Sin asignar</option>
            {empleados?.map((empleado) => (
              <option key={empleado.id} value={empleado.user_id}>
                {empleado.nombre?.trim() || empleado.username}
              </option>
            ))}
          </SelectNative>
        </div>
      )}

      {lead && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeEtiquetas.map((etiqueta) => (
            <Badge
              key={etiqueta}
              variant="secondary"
              className="cursor-pointer gap-1 pr-1"
              onClick={() => toggleEtiqueta(etiqueta)}
              title="Quitar etiqueta"
            >
              {etiquetaLabel(etiqueta)}
              <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="icon-xs"
            className="rounded-full"
            onClick={() => setEtiquetasOpen((prev) => !prev)}
            aria-label="Agregar o quitar etiquetas"
            aria-expanded={etiquetasOpen}
          >
            <Plus className={cn("h-3 w-3 transition-transform", etiquetasOpen && "rotate-45")} />
          </Button>

          {etiquetasOpen && (
            <div className="flex w-full flex-wrap gap-1.5 pt-0.5">
              {ALL_ETIQUETAS.map((etiqueta) => {
                const active = activeEtiquetas.includes(etiqueta)
                return (
                  <Badge
                    key={etiqueta}
                    variant={active ? "secondary" : "outline"}
                    className="cursor-pointer text-muted-foreground/90 data-[active=true]:text-foreground"
                    data-active={active}
                    onClick={() => toggleEtiqueta(etiqueta)}
                  >
                    {etiquetaLabel(etiqueta)}
                  </Badge>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
