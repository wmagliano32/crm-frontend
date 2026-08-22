import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { LeadFichaPanel } from "@/components/ficha/lead-ficha-panel"
import { LeadListSkeleton } from "@/components/leads/lead-list-skeleton"
import { LeadListEmpty, LeadListError } from "@/components/leads/lead-list-states"
import { LeadRow } from "@/components/leads/lead-row"
import { LeadsSegmentTabs, type LeadsSegment } from "@/components/leads/leads-segment-tabs"
import { LeadsTabs, type LeadsTabKey } from "@/components/leads/leads-tabs"
import { LeadThreadPanel } from "@/components/thread/lead-thread-panel"
import { Input } from "@/components/ui/input"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useAllScopeLeads, useArchivedScopeLeads, useDefaultScopeLeads } from "@/hooks/use-leads"
import { useAuth } from "@/lib/auth-context"
import { displayNameFor } from "@/lib/lead-format"
import type { Lead } from "@/lib/types"
import { cn } from "@/lib/utils"

// "Pendientes" (Fase 2.1, criterio revisado): leads vivos que nadie tomó,
// no el criterio original de "último mensaje entrante" — el bot responde
// casi siempre, así que ese criterio dejaba afuera leads que quedaron
// esperando una respuesta humana durante meses.
function isPendiente(lead: Lead): boolean {
  return lead.assigned_to_id === null && lead.stage !== "CLOSED" && lead.stage !== "OPTED_OUT"
}

// Mismo campo que ahora se muestra y colorea en cada fila (last_inbound_at):
// si se ordenara por otra cosa, los rojos no quedarían arriba de verdad. Un
// lead que nunca escribió (last_inbound_at null) se trata como el caso más
// frío posible — el bot le habló y no hay ni una respuesta — así que va
// primero, antes que cualquier fecha real por vieja que sea.
function byOldestLastInboundFirst(a: Lead, b: Lead): number {
  const at = a.last_inbound_at ? new Date(a.last_inbound_at).getTime() : Number.NEGATIVE_INFINITY
  const bt = b.last_inbound_at ? new Date(b.last_inbound_at).getTime() : Number.NEGATIVE_INFINITY
  return at - bt
}

// Clientes (Fase 2.6): "el más olvidado primero" no sirve como default
// cuando TODOS están igual de vacíos (los importados nunca escribieron al
// número nuevo, last_inbound_at null en los 38). Los que SÍ ya escribieron
// van primero, con el mismo criterio de urgencia que un prospecto — dejan
// de estar "vacíos" en cuanto mandan un mensaje real y merecen la misma
// prioridad. Los que todavía no escribieron van después, alfabético por
// nombre — así la lista se puede recorrer/buscar mientras no hay actividad
// real que priorizar, en vez de quedar en un orden arbitrario de carga.
function byClientDefaultOrder(a: Lead, b: Lead): number {
  const aWrote = a.last_inbound_at !== null
  const bWrote = b.last_inbound_at !== null
  if (aWrote !== bWrote) return aWrote ? -1 : 1
  if (aWrote && bWrote) return byOldestLastInboundFirst(a, b)
  return displayNameFor(a).localeCompare(displayNameFor(b), "es", { sensitivity: "base" })
}

export function BandejaPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { leadId } = useParams<{ leadId: string }>()
  const selectedLeadId = leadId ? Number(leadId) : null
  // La ficha es una ruta, no un estado de componente aparte (Fase 2.5):
  // en escritorio es un panel colapsable de una tercera columna, en
  // celular reemplaza todo — los dos casos son la MISMA condición
  // ("¿la ruta actual termina en /ficha?"), resuelta con CSS responsive
  // más abajo, no con dos mecanismos distintos. De regalo, sobrevive a un
  // reload igual que el hilo (Fase 2.2).
  const fichaOpen = location.pathname.endsWith("/ficha")

  // Segmento en la URL (?segmento=clientes), no en un useState — pedido
  // explícito de que sobreviva a un reload. "prospectos" es el default
  // implícito (sin query param), así la URL no se ensucia con el caso
  // más común.
  const [searchParams, setSearchParams] = useSearchParams()
  const segment: LeadsSegment = searchParams.get("segmento") === "clientes" ? "clientes" : "prospectos"
  const isClienteSegment = segment === "clientes"

  function handleSegmentChange(next: LeadsSegment) {
    const params = new URLSearchParams(searchParams)
    if (next === "clientes") params.set("segmento", "clientes")
    else params.delete("segmento")
    setSearchParams(params, { replace: true })
  }

  const [tab, setTab] = useState<LeadsTabKey>("pendientes")
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query, 300)

  const defaultScope = useDefaultScopeLeads(debouncedQuery)
  const allScope = useAllScopeLeads(debouncedQuery)
  const archivedScope = useArchivedScopeLeads(debouncedQuery)

  const defaultLeads = useMemo(() => defaultScope.data?.results ?? [], [defaultScope.data])
  const allLeads = useMemo(() => allScope.data?.results ?? [], [allScope.data])
  const archivedLeads = useMemo(() => archivedScope.data?.results ?? [], [archivedScope.data])

  const segmentDefaultLeads = useMemo(
    () => defaultLeads.filter((lead) => lead.es_cliente === isClienteSegment),
    [defaultLeads, isClienteSegment]
  )
  const segmentAllLeads = useMemo(
    () => allLeads.filter((lead) => lead.es_cliente === isClienteSegment),
    [allLeads, isClienteSegment]
  )
  const segmentArchivedLeads = useMemo(
    () => archivedLeads.filter((lead) => lead.es_cliente === isClienteSegment),
    [archivedLeads, isClienteSegment]
  )

  const pendientes = useMemo(
    () => segmentDefaultLeads.filter(isPendiente).sort(isClienteSegment ? byClientDefaultOrder : byOldestLastInboundFirst),
    [segmentDefaultLeads, isClienteSegment]
  )
  const mios = useMemo(
    () => segmentDefaultLeads.filter((lead) => user && lead.assigned_to_id === user.id),
    [segmentDefaultLeads, user]
  )
  const todos = useMemo(
    () => (isClienteSegment ? [...segmentAllLeads].sort(byClientDefaultOrder) : segmentAllLeads),
    [segmentAllLeads, isClienteSegment]
  )
  const archivados = useMemo(
    () => (isClienteSegment ? [...segmentArchivedLeads].sort(byClientDefaultOrder) : segmentArchivedLeads),
    [segmentArchivedLeads, isClienteSegment]
  )

  const rows = tab === "pendientes" ? pendientes : tab === "mios" ? mios : tab === "archivados" ? archivados : todos
  const activeQueryResult = tab === "todos" ? allScope : tab === "archivados" ? archivedScope : defaultScope

  const counts = {
    pendientes: defaultScope.data ? pendientes.length : undefined,
    mios: defaultScope.data ? mios.length : undefined,
    todos: allScope.data ? todos.length : undefined,
    archivados: archivedScope.data ? archivados.length : undefined,
  }
  const segmentCounts = {
    prospectos: allScope.data ? allLeads.filter((lead) => !lead.es_cliente).length : undefined,
    clientes: allScope.data ? allLeads.filter((lead) => lead.es_cliente).length : undefined,
  }

  const hasSelection = selectedLeadId !== null

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* Escritorio: lista + hilo lado a lado, siempre las dos. Celular:
          pilas, no columnas — con un lead seleccionado el hilo reemplaza
          la lista a pantalla completa (se oculta con "hidden", no se
          desmonta la lista para no perder su scroll/estado al volver). */}
      <div
        className={cn(
          "flex h-full min-h-0 w-full flex-col md:w-[340px] md:shrink-0 md:border-r md:border-border md:flex",
          hasSelection && "hidden"
        )}
      >
        <div className="shrink-0 border-b border-border px-3 pt-2">
          <LeadsSegmentTabs value={segment} onChange={handleSegmentChange} counts={segmentCounts} />
        </div>

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
            <LeadListEmpty message={emptyMessageFor(tab, segment, Boolean(debouncedQuery))} />
          ) : (
            rows.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                isSelected={lead.id === selectedLeadId}
                isArchived={tab === "archivados"}
                onClick={() => navigate(`/bandeja/${lead.id}${location.search}`)}
              />
            ))
          )}
        </div>
      </div>

      <div className={cn("h-full min-h-0 flex-1", (!hasSelection || fichaOpen) && "hidden md:block")}>
        {selectedLeadId !== null ? (
          // key=leadId: fuerza remount al cambiar de lead — resetea de
          // una el scroll del hilo y los mensajes "enviando"/con error en
          // curso, en vez de tener que limpiarlos a mano.
          <LeadThreadPanel key={selectedLeadId} leadId={selectedLeadId} onBack={() => navigate(`/${location.search}`)} />
        ) : (
          <div className="hidden h-full items-center justify-center text-sm text-muted-foreground md:flex">
            Elegí una conversación para ver el hilo.
          </div>
        )}
      </div>

      {selectedLeadId !== null && fichaOpen && (
        <div className="h-full min-h-0 w-full md:w-[340px] md:shrink-0 md:border-l md:border-border">
          <LeadFichaPanel
            key={selectedLeadId}
            leadId={selectedLeadId}
            onClose={() => navigate(`/bandeja/${selectedLeadId}${location.search}`)}
          />
        </div>
      )}
    </div>
  )
}

function emptyMessageFor(tab: LeadsTabKey, segment: LeadsSegment, hasQuery: boolean): string {
  if (hasQuery) return "No encontramos leads que coincidan con la búsqueda."
  const quien = segment === "clientes" ? "clientes" : "prospectos"
  if (tab === "pendientes") return `No hay ${quien} pendientes. Buen trabajo.`
  if (tab === "mios") return `Todavía no tenés ${quien} asignados.`
  if (tab === "archivados") return `No hay ${quien} archivados.`
  return `No hay ${quien} para mostrar.`
}
