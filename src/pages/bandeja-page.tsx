import { Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { LeadFichaPanel } from "@/components/ficha/lead-ficha-panel"
import { LeadListSkeleton } from "@/components/leads/lead-list-skeleton"
import { LeadListEmpty, LeadListError } from "@/components/leads/lead-list-states"
import { LeadRow } from "@/components/leads/lead-row"
import { LeadsSegmentTabs, type LeadsSegment } from "@/components/leads/leads-segment-tabs"
import { LeadsTabs, type LeadsTabKey } from "@/components/leads/leads-tabs"
import { ResizeHandle } from "@/components/layout/resize-handle"
import { LeadThreadPanel } from "@/components/thread/lead-thread-panel"
import { Input } from "@/components/ui/input"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useAllScopeLeads, useArchivedScopeLeads, useDefaultScopeLeads } from "@/hooks/use-leads"
import { useResizableWidth } from "@/hooks/use-resizable-width"
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

// Fase 3.4, diseño aprobado: recency-first en los dos segmentos, todas las
// tabs -- el backend ya ordena por -last_inbound_at con nulls last
// (LeadViewSet.get_queryset), así que filter() por segmento preserva ese
// orden para el bucket "escribió" sin necesidad de reordenarlo acá.
// Lo único que queda del lado del cliente es la posición de "nunca
// escribió", porque es asimétrica por segmento y el backend no conoce el
// segmento (es_cliente se filtra 100% en el frontend):
//   - Prospectos: primero (alguien le debe un primer mensaje).
//   - Clientes: último (una relación existente en silencio no urge).
// Alfabético entre sí dentro de ese bucket, para no dejarlos en el orden
// arbitrario de llegada de la página.
function reorderNeverWrote(leads: Lead[], neverWroteFirst: boolean): Lead[] {
  const wrote: Lead[] = []
  const neverWrote: Lead[] = []
  for (const lead of leads) {
    ;(lead.last_inbound_at ? wrote : neverWrote).push(lead)
  }
  neverWrote.sort((a, b) => displayNameFor(a).localeCompare(displayNameFor(b), "es", { sensitivity: "base" }))
  return neverWroteFirst ? [...neverWrote, ...wrote] : [...wrote, ...neverWrote]
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
    () => reorderNeverWrote(defaultLeads.filter((lead) => lead.es_cliente === isClienteSegment), !isClienteSegment),
    [defaultLeads, isClienteSegment]
  )
  const segmentAllLeads = useMemo(
    () => reorderNeverWrote(allLeads.filter((lead) => lead.es_cliente === isClienteSegment), !isClienteSegment),
    [allLeads, isClienteSegment]
  )
  const segmentArchivedLeads = useMemo(
    () => reorderNeverWrote(archivedLeads.filter((lead) => lead.es_cliente === isClienteSegment), !isClienteSegment),
    [archivedLeads, isClienteSegment]
  )

  const pendientes = useMemo(() => segmentDefaultLeads.filter(isPendiente), [segmentDefaultLeads])
  const mios = useMemo(
    () => segmentDefaultLeads.filter((lead) => user && lead.assigned_to_id === user.id),
    [segmentDefaultLeads, user]
  )
  const todos = segmentAllLeads
  const archivados = segmentArchivedLeads

  const rows = tab === "pendientes" ? pendientes : tab === "mios" ? mios : tab === "archivados" ? archivados : todos
  const activeQueryResult = tab === "todos" ? allScope : tab === "archivados" ? archivedScope : defaultScope

  const counts = {
    pendientes: defaultScope.data ? pendientes.length : undefined,
    mios: defaultScope.data ? mios.length : undefined,
    todos: allScope.data ? todos.length : undefined,
    archivados: archivedScope.data ? archivados.length : undefined,
  }
  const segmentCounts = {
    prospectos: allScope.data
      ? { total: allLeads.filter((lead) => !lead.es_cliente).length, unread: allLeads.filter((lead) => !lead.es_cliente && lead.unread).length }
      : undefined,
    clientes: allScope.data
      ? { total: allLeads.filter((lead) => lead.es_cliente).length, unread: allLeads.filter((lead) => lead.es_cliente && lead.unread).length }
      : undefined,
  }

  // Fase 2.11, pedido explícito: el título cuenta los no leídos de AMBOS
  // segmentos (Prospectos + Clientes), no solo el que se está mirando —
  // allLeads ya los trae a los dos juntos, sin filtrar por segmento.
  const totalUnread = useMemo(() => allLeads.filter((lead) => lead.unread).length, [allLeads])
  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread}) WAM CRM` : "WAM CRM"
    // Al salir de la bandeja (ej. logout, BandejaPage desmonta y entra
    // LoginPage) el título no debe quedar pegado en "(3) WAM CRM".
    return () => {
      document.title = "WAM CRM"
    }
  }, [totalUnread])

  const hasSelection = selectedLeadId !== null

  // Fase 3.1, diseño aprobado: anchos ajustables en escritorio, persistidos
  // por separado (lista↔hilo y hilo↔ficha son bordes independientes).
  // Mínimos/máximos razonables para no poder romper el layout -- no
  // aplica en mobile, donde la navegación sigue siendo por pilas.
  const listWidth = useResizableWidth("crm_bandeja_list_width", 340, 260, 520)
  const fichaWidth = useResizableWidth("crm_bandeja_ficha_width", 340, 260, 520)

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* Escritorio: lista + hilo lado a lado, siempre las dos. Celular:
          pilas, no columnas — con un lead seleccionado el hilo reemplaza
          la lista a pantalla completa (se oculta con "hidden", no se
          desmonta la lista para no perder su scroll/estado al volver). */}
      <div
        style={{ "--list-width": `${listWidth.width}px` } as React.CSSProperties}
        className={cn(
          "flex h-full min-h-0 w-full flex-col md:w-[var(--list-width)] md:shrink-0 md:flex",
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

      <ResizeHandle onMouseDown={listWidth.startResize(1)} />

      {/* min-w-0: sin esto, un mensaje con una cadena larga sin espacios
          (ej. un link) infla el min-width automático de este flex item más
          allá del ancho real disponible, y en mobile empuja los globos OUT
          fuera del viewport (Bug 2, reportado en producción). */}
      <div className={cn("h-full min-h-0 min-w-0 flex-1", (!hasSelection || fichaOpen) && "hidden md:block")}>
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
        <>
          <ResizeHandle onMouseDown={fichaWidth.startResize(-1)} />
          <div
            style={{ "--ficha-width": `${fichaWidth.width}px` } as React.CSSProperties}
            className="h-full min-h-0 w-full md:w-[var(--ficha-width)] md:shrink-0"
          >
            <LeadFichaPanel
              key={selectedLeadId}
              leadId={selectedLeadId}
              onClose={() => navigate(`/bandeja/${selectedLeadId}${location.search}`)}
            />
          </div>
        </>
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
