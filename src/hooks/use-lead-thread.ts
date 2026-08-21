import { useInfiniteQuery } from "@tanstack/react-query"
import { fetchLeadMessages } from "@/lib/messages-api"

const THREAD_PAGE_LIMIT = 50

// Cada página trae los siguientes 50 mensajes MÁS VIEJOS que el cursor
// (más reciente primero dentro de la página). fetchNextPage() pide una
// página más vieja — "cargar anteriores" en la UI, nunca scroll infinito
// automático (pedido explícito de Walter). Aplanar data.pages en orden de
// llegada ya da la lista completa ordenada de más nuevo a más viejo, sin
// necesidad de volver a ordenar en el cliente.
export function useLeadThread(leadId: number | null) {
  return useInfiniteQuery({
    queryKey: ["lead-thread", leadId],
    queryFn: ({ pageParam }) => fetchLeadMessages(leadId as number, { before: pageParam ?? undefined, limit: THREAD_PAGE_LIMIT }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    enabled: leadId !== null,
    staleTime: 15_000,
  })
}
