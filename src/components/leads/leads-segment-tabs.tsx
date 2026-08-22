import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type LeadsSegment = "prospectos" | "clientes"

interface SegmentCount {
  total: number
  // Fase 2.11: cuántos de ese segmento tienen unread=true. Ausente
  // mientras la query todavía no resolvió (mismo criterio que "total"
  // ausente hoy).
  unread: number
}

interface LeadsSegmentTabsProps {
  value: LeadsSegment
  onChange: (value: LeadsSegment) => void
  counts: Partial<Record<LeadsSegment, SegmentCount>>
}

const SEGMENT_LABEL: Record<LeadsSegment, string> = {
  prospectos: "Prospectos",
  clientes: "Clientes",
}

// Por encima de los tabs (Pendientes/Míos/Todos), no al lado — son dos
// trabajos distintos (perseguir una venta vs. atender a alguien que ya
// paga), variant="line" los distingue visualmente de la fila de abajo en
// vez de verse como "más tabs".
export function LeadsSegmentTabs({ value, onChange, counts }: LeadsSegmentTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as LeadsSegment)}>
      <TabsList variant="line" className="w-full">
        {(["prospectos", "clientes"] as const).map((key) => {
          const count = counts[key]
          return (
            <TabsTrigger key={key} value={key} className="flex-1 gap-1.5 text-sm font-semibold">
              {SEGMENT_LABEL[key]}
              <span className="text-xs font-normal text-muted-foreground">{count?.total ?? "–"}</span>
              {/* Badge, no solo otro número (Fase 2.11, pedido explícito):
                  tiene que notarse aunque estés mirando el otro segmento. */}
              {!!count?.unread && (
                <Badge className="h-4 min-w-4 px-1 text-[10px] tabular-nums">{count.unread}</Badge>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
