import { useQueryClient, type InfiniteData } from "@tanstack/react-query"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { fetchLeadMessages } from "@/lib/messages-api"
import type { MessageThreadPage, ThreadMessage } from "@/lib/types"

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

const NEW_MESSAGES_POLL_MS = 30_000

// Fase 2.11.1, Paso 0 aprobado: con el hilo ya abierto, un mensaje nuevo
// del mismo lead no llega solo — ni useLeadThread ni useLead tienen
// polling propio para eso. Esto sondea SOLO lo posterior al último
// mensaje que ya está en caché (?after_id=, ver LeadViewSet.messages) y
// lo mergea directo en la página más nueva de la infinite query, sin
// tocar las páginas viejas ya cargadas — evita repaginar el hilo entero
// cada 30s (Lead con muchas conversaciones/mensajes) y evita el riesgo de
// pisar/duplicar lo que el usuario ya cargó con "cargar anteriores".
//
// Intervalo manual, no refetchInterval de TanStack: el cursor (afterId)
// cambia cada vez que se mergea algo nuevo, y no queremos que ese cambio
// reinicie el timer. Un intervalo fijo leyendo el cursor de una ref evita
// esa cascada. (Igual queda sujeto al throttling de timers en segundo
// plano que aplica cualquier navegador — ver nota de refetchIntervalInBackground
// en use-leads.ts, la limitación de fondo es la misma para los dos casos.)
export function usePollNewMessages(
  leadId: number | null,
  latestMessageId: number | null,
  onNewMessages: (messages: ThreadMessage[]) => void
) {
  const queryClient = useQueryClient()
  const latestIdRef = useRef(latestMessageId)
  const onNewMessagesRef = useRef(onNewMessages)
  // Mantenerlas al día en un efecto, no durante el render (linter React:
  // escribir un ref en render es un side effect fuera de lugar) — el
  // setInterval de abajo solo las lee de forma async, así que este orden
  // no le cambia nada.
  useEffect(() => {
    latestIdRef.current = latestMessageId
    onNewMessagesRef.current = onNewMessages
  })

  useEffect(() => {
    if (leadId === null) return

    const tick = async () => {
      const afterId = latestIdRef.current
      let page: MessageThreadPage
      try {
        // Sin afterId (hilo vacío, todavía sin ningún mensaje cacheado):
        // se pide igual que la carga inicial, sin cursor.
        page = await fetchLeadMessages(leadId, afterId !== null ? { afterId } : {})
      } catch {
        return // un tick fallido no es grave, el siguiente reintenta solo
      }
      if (page.results.length === 0) return

      queryClient.setQueryData<InfiniteData<MessageThreadPage, string | null>>(["lead-thread", leadId], (old) => {
        if (!old || old.pages.length === 0) return old
        const [firstPage, ...rest] = old.pages
        // page.results viene más-reciente-primero, igual que firstPage —
        // los nuevos van adelante.
        return { ...old, pages: [{ ...firstPage, results: [...page.results, ...firstPage.results] }, ...rest] }
      })

      // buildThreadItems espera orden ascendente (viejo -> nuevo).
      onNewMessagesRef.current([...page.results].reverse())
    }

    const interval = setInterval(tick, NEW_MESSAGES_POLL_MS)
    return () => clearInterval(interval)
  }, [leadId, queryClient])
}
