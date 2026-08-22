import { useQuery } from "@tanstack/react-query"
import { fetchLead, fetchLeads } from "@/lib/leads-api"

// Dos queries en paralelo, siempre activas: la bandeja "por defecto" (sin
// scope — activas sin archivar) alimenta las tabs Pendientes/Míos, que se
// calculan en el cliente sobre estos mismos datos; "Todos" (scope=all) es
// una query aparte. Con ~28 leads en total, pedir ambas de una no cuesta
// nada y permite mostrar los 3 contadores de tabs desde el arranque, sin
// esperar a que el usuario cambie de tab.

// Fase 2.11, Paso 0 aprobado: sin esto no hay ninguna forma de que el
// contador de no leídos (tabs de segmento) ni el título de la pestaña se
// actualicen solos — hoy la bandeja solo refresca al enfocar la ventana
// (refetchOnWindowFocus en App.tsx) o al vencer el staleTime y remontar
// algo. 30s alcanza para "no se te pasa un mensaje", sin ser agresivo.
//
// refetchIntervalInBackground: true es NO NEGOCIABLE para esta feature,
// no un capricho — TanStack Query lo trae en `false` por default, lo que
// PAUSA el polling justo cuando la pestaña está en segundo plano. Es
// exactamente el caso que el indicador del título del navegador más
// necesita cubrir ("con la app abierta en otra pestaña", pedido
// explícito de la Fase 2.11): sin este `true`, el título dejaría de
// actualizarse apenas el usuario cambia de pestaña, que es lo opuesto de
// lo que se pidió. Si alguien lo saca "para limpiar" sin leer esto, la
// pestaña vuelve a quedarse muda en segundo plano.
const UNREAD_POLL_OPTIONS = {
  refetchInterval: 30_000,
  refetchIntervalInBackground: true,
} as const

export function useDefaultScopeLeads(q: string) {
  return useQuery({
    queryKey: ["leads", "default", q],
    queryFn: () => fetchLeads({ q: q || undefined }),
    staleTime: 30_000,
    ...UNREAD_POLL_OPTIONS,
  })
}

export function useAllScopeLeads(q: string) {
  return useQuery({
    queryKey: ["leads", "all", q],
    queryFn: () => fetchLeads({ scope: "all", q: q || undefined }),
    staleTime: 30_000,
    ...UNREAD_POLL_OPTIONS,
  })
}

// Fase 2.8: tab "Archivados" — misma lógica que "Todos", query aparte
// para poder mostrar su contador desde el arranque igual que las otras
// tabs, sin esperar a que el usuario la abra.
export function useArchivedScopeLeads(q: string) {
  return useQuery({
    queryKey: ["leads", "archived", q],
    queryFn: () => fetchLeads({ scope: "archived", q: q || undefined }),
    staleTime: 30_000,
  })
}

// Fase 2.2: el hilo necesita los datos del lead (nombre, teléfono, stage)
// incluso al entrar directo por /bandeja/:leadId (recarga de página), sin
// depender de que la lista ya esté cargada en memoria.
// Fase 2.11.1, Paso 0 aprobado: mismo polling que las listas — sin esto,
// el panel del hilo abierto queda ciego a que llegó un mensaje nuevo
// (last_inbound_at) hasta que el usuario sale y vuelve a entrar, aunque
// la lista de al lado ya lo sepa por su propio polling.
export function useLead(leadId: number | null) {
  return useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => fetchLead(leadId as number),
    enabled: leadId !== null,
    staleTime: 30_000,
    ...UNREAD_POLL_OPTIONS,
  })
}
