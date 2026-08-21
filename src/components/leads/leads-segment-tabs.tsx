import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type LeadsSegment = "prospectos" | "clientes"

interface LeadsSegmentTabsProps {
  value: LeadsSegment
  onChange: (value: LeadsSegment) => void
  counts: Partial<Record<LeadsSegment, number>>
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
        {(["prospectos", "clientes"] as const).map((key) => (
          <TabsTrigger key={key} value={key} className="flex-1 gap-1.5 text-sm font-semibold">
            {SEGMENT_LABEL[key]}
            <span className="text-xs font-normal text-muted-foreground">{counts[key] ?? "–"}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
