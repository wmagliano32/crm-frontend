import { BadgeCheck, X } from "lucide-react"
import { InlineField } from "@/components/ficha/inline-field"
import { Badge } from "@/components/ui/badge"
import { SelectNative } from "@/components/ui/select-native"
import { Skeleton } from "@/components/ui/skeleton"
import { useSetLeadStage, useUpdateLead } from "@/hooks/use-lead-actions"
import { useLead } from "@/hooks/use-leads"
import { stageLabel } from "@/lib/lead-format"
import type { LeadStage, LeadUpdatePayload } from "@/lib/types"

const STAGE_OPTIONS: LeadStage[] = ["NEW", "QUALIFY", "PITCH", "SCHEDULING", "BOOKED", "HANDOFF", "OPTED_OUT", "CLOSED"]

const CONVERSION_DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" })

export function LeadFichaPanel({ leadId, onClose }: { leadId: number; onClose: () => void }) {
  const { data: lead, isLoading } = useLead(leadId)
  const stageMutation = useSetLeadStage(leadId)
  const updateMutation = useUpdateLead(leadId)

  function save<K extends keyof LeadUpdatePayload>(field: K, value: LeadUpdatePayload[K]) {
    updateMutation.mutate({ [field]: value } as LeadUpdatePayload)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <p className="text-sm font-medium">Ficha del lead</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ficha"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading || !lead ? (
          <div className="flex flex-col gap-3 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-3">
            {lead.es_cliente && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                <BadgeCheck className="h-4 w-4 shrink-0" />
                <span>
                  Es cliente
                  {lead.fecha_conversion && ` desde el ${CONVERSION_DATE_FORMATTER.format(new Date(lead.fecha_conversion))}`}
                </span>
              </div>
            )}

            <section className="flex flex-col gap-1">
              <h3 className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Etapa</h3>
              <div className="px-2">
                <SelectNative
                  value={lead.stage}
                  disabled={stageMutation.isPending}
                  onChange={(e) => stageMutation.mutate(e.target.value as LeadStage)}
                  aria-label="Cambiar etapa"
                >
                  {STAGE_OPTIONS.map((stage) => (
                    <option key={stage} value={stage}>
                      {stageLabel(stage)}
                    </option>
                  ))}
                </SelectNative>
                {stageMutation.isError && <p className="mt-1 text-xs text-destructive">No se pudo cambiar la etapa.</p>}
              </div>
            </section>

            <section className="flex flex-col gap-0.5">
              <h3 className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Contacto</h3>
              <InlineField label="Email" value={lead.email} onSave={(v) => save("email", v as string)} />
              <InlineField label="Empresa" value={lead.company} onSave={(v) => save("company", v as string)} />
              <InlineField label="Cargo" value={lead.role} onSave={(v) => save("role", v as string)} />
              <InlineField label="Ciudad" value={lead.city} onSave={(v) => save("city", v as string)} />
            </section>

            <section className="flex flex-col gap-0.5">
              <h3 className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Calificación</h3>
              <InlineField
                label="Cantidad de consorcios"
                value={lead.consorcios_count}
                type="number"
                onSave={(v) => save("consorcios_count", v as number | null)}
              />
              <InlineField
                label="Unidades funcionales (UF)"
                value={lead.units_count}
                type="number"
                onSave={(v) => save("units_count", v as number | null)}
              />
              <InlineField label="Sistema actual" value={lead.current_system} onSave={(v) => save("current_system", v as string)} />
              <InlineField
                label="Dolor principal"
                value={lead.main_pain}
                type="textarea"
                onSave={(v) => save("main_pain", v as string)}
              />
              <InlineField label="Score" value={lead.score} type="number" onSave={(v) => save("score", (v as number) ?? 0)} />
            </section>

            {updateMutation.isError && (
              <Badge variant="destructive" className="self-start">
                No se pudo guardar el último cambio
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
