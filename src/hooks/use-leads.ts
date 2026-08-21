import { useQuery } from "@tanstack/react-query"
import { fetchLeads } from "@/lib/leads-api"

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
