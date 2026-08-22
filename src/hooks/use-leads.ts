import { useQuery } from "@tanstack/react-query"
import { fetchLead, fetchLeads } from "@/lib/leads-api"

// Dos queries en paralelo, siempre activas: la bandeja "por defecto" (sin
// scope — activas sin archivar) alimenta las tabs Pendientes/Míos, que se
// calculan en el cliente sobre estos mismos datos; "Todos" (scope=all) es
// una query aparte. Con ~28 leads en total, pedir ambas de una no cuesta
// nada y permite mostrar los 3 contadores de tabs desde el arranque, sin
// esperar a que el usuario cambie de tab.

export function useDefaultScopeLeads(q: string) {
  return useQuery({
    queryKey: ["leads", "default", q],
    queryFn: () => fetchLeads({ q: q || undefined }),
    staleTime: 30_000,
  })
}

export function useAllScopeLeads(q: string) {
  return useQuery({
    queryKey: ["leads", "all", q],
    queryFn: () => fetchLeads({ scope: "all", q: q || undefined }),
    staleTime: 30_000,
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
export function useLead(leadId: number | null) {
  return useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => fetchLead(leadId as number),
    enabled: leadId !== null,
    staleTime: 30_000,
  })
}
