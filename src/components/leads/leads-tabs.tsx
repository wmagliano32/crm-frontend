import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type LeadsTabKey = "pendientes" | "mios" | "todos"

interface LeadsTabsProps {
  value: LeadsTabKey
  onChange: (value: LeadsTabKey) => void
  counts: Partial<Record<LeadsTabKey, number>>
}

const TAB_LABEL: Record<LeadsTabKey, string> = {
  pendientes: "Pendientes",
  mios: "Míos",
  todos: "Todos",
}

export function LeadsTabs({ value, onChange, counts }: LeadsTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as LeadsTabKey)}>
      <TabsList className="w-full">
        {(["pendientes", "mios", "todos"] as const).map((key) => (
          <TabsTrigger key={key} value={key} className="flex-1 gap-1 text-xs">
            {TAB_LABEL[key]}
            <span className="text-muted-foreground">{counts[key] ?? "–"}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
