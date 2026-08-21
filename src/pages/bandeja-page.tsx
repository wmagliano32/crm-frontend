import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import { LeadListSkeleton } from "@/components/leads/lead-list-skeleton"
import { LeadListEmpty, LeadListError } from "@/components/leads/lead-list-states"
import { LeadRow } from "@/components/leads/lead-row"
import { LeadsTabs, type LeadsTabKey } from "@/components/leads/leads-tabs"
import { Input } from "@/components/ui/input"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useAllScopeLeads, useDefaultScopeLeads } from "@/hooks/use-leads"
import { useAuth } from "@/lib/auth-context"
import type { Lead } from "@/lib/types"

// "Pendientes" (Fase 2.1, criterio revisado): leads vivos que nadie tomó,
// no el criterio original de "último mensaje entrante" — el bot responde
// casi siempre, así que ese criterio dejaba afuera leads que quedaron
// esperando una respuesta humana durante meses.
function isPendiente(lead: Lead): boolean {
  return lead.assigned_to_id === null && lead.stage !== "CLOSED" && lead.stage !== "OPTED_OUT"
}

function byOldestLastMessageFirst(a: Lead, b: Lead): number {
  const at = a.last_message_at ? new Date(a.last_message_at).getTime() : Number.POSITIVE_INFINITY
  const bt = b.last_message_at ? new Date(b.last_message_at).getTime() : Number.POSITIVE_INFINITY
  return at - bt
}

export function BandejaPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<LeadsTabKey>("pendientes")
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query, 300)

  const defaultScope = useDefaultScopeLeads(debouncedQuery)
  const allScope = useAllScopeLeads(debouncedQuery)

  const defaultLeads = useMemo(() => defaultScope.data?.results ?? [], [defaultScope.data])
  const allLeads = allScope.data?.results ?? []

  const pendientes = useMemo(
    () => defaultLeads.filter(isPendiente).sort(byOldestLastMessageFirst),
    [defaultLeads]
  )
  const mios = useMemo(
    () => defaultLeads.filter((lead) => user && lead.assigned_to_id === user.id),
    [defaultLeads, user]
  )

  const rows = tab === "pendientes" ? pendientes : tab === "mios" ? mios : allLeads
  const activeQueryResult = tab === "todos" ? allScope : defaultScope

  const counts = {
    pendientes: defaultScope.data ? pendientes.length : undefined,
    mios: defaultScope.data ? mios.length : undefined,
    todos: allScope.data ? allScope.data.count : undefined,
  }

  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="flex h-full min-h-0 w-full flex-col md:w-[340px] md:shrink-0 md:border-r md:border-border">
        <div className="shrink-0 border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o teléfono…"
              className="pl-8"
            />
          </div>
        </div>

        <div className="shrink-0 border-b border-border p-2">
          <LeadsTabs value={tab} onChange={setTab} counts={counts} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeQueryResult.isLoading ? (
            <LeadListSkeleton />
          ) : activeQueryResult.isError ? (
            <LeadListError onRetry={() => activeQueryResult.refetch()} />
          ) : rows.length === 0 ? (
            <LeadListEmpty message={emptyMessageFor(tab, Boolean(debouncedQuery))} />
          ) : (
            rows.map((lead) => <LeadRow key={lead.id} lead={lead} />)
          )}
        </div>
      </div>

      {/* Reservado para el hilo de mensajes (Fase 2.2). */}
      <div className="hidden flex-1 md:block" />
    </div>
  )
}

function emptyMessageFor(tab: LeadsTabKey, hasQuery: boolean): string {
  if (hasQuery) return "No encontramos leads que coincidan con la búsqueda."
  if (tab === "pendientes") return "No hay conversaciones pendientes. Buen trabajo."
  if (tab === "mios") return "Todavía no tenés conversaciones asignadas."
  return "No hay leads para mostrar."
}
