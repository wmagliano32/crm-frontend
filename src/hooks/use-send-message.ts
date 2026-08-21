import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { sendConversationTemplate, sendLeadMessage } from "@/lib/conversations-api"
import type { SendMessageResponse, WaSendResult } from "@/lib/types"

export interface PendingMessage {
  localId: string
  text: string
  createdAt: string
  status: "sending" | "error"
  errorReason: string | null
}

interface PendingRecord extends PendingMessage {
  request: () => Promise<SendMessageResponse>
}

let pendingIdCounter = 0

function waErrorReason(wa: WaSendResult): string {
  if (wa.error === "template_required" || wa.code === 63016 || wa.code === "63016") {
    return "Fuera de la ventana de 24h: requiere una plantilla aprobada."
  }
  if (wa.error === "missing to/from") return "Falta configuración de envío (número de origen)."
  return "No se pudo enviar por WhatsApp."
}

// Optimistic update: el mensaje aparece "enviando" al instante. Al
// resolver, si salió bien se descarta el optimista y se invalida el hilo
// (["lead-thread", leadId]) para que el mensaje REAL (con su
// delivery_status/hora definitivos) reemplace al provisorio — evita
// mantener dos fuentes de verdad para el mismo mensaje. Si wa.ok es false
// (200 de HTTP pero Twilio lo rechazó, ej. fuera de ventana) o la request
// falla, el optimista queda visible con estado de error y motivo, nunca
// desaparece en silencio. Cada item guarda su propio request() para poder
// reintentarlo tal cual (texto libre y plantilla pegan a endpoints
// distintos, "reintentar" no puede asumir cuál era).
export function useSendMessage(leadId: number) {
  const [pending, setPending] = useState<PendingRecord[]>([])
  const queryClient = useQueryClient()

  const resolvePending = useCallback(
    async (localId: string, request: () => Promise<SendMessageResponse>) => {
      try {
        const resp = await request()
        if (resp.wa && resp.wa.ok === false) {
          const reason = waErrorReason(resp.wa)
          setPending((prev) => prev.map((p) => (p.localId === localId ? { ...p, status: "error", errorReason: reason } : p)))
          return
        }
        setPending((prev) => prev.filter((p) => p.localId !== localId))
        queryClient.invalidateQueries({ queryKey: ["lead-thread", leadId] })
      } catch {
        setPending((prev) =>
          prev.map((p) =>
            p.localId === localId ? { ...p, status: "error", errorReason: "No se pudo enviar. Revisá tu conexión." } : p
          )
        )
      }
    },
    [leadId, queryClient]
  )

  const enqueue = useCallback(
    (text: string, request: () => Promise<SendMessageResponse>) => {
      const localId = `pending-${Date.now()}-${pendingIdCounter++}`
      setPending((prev) => [
        ...prev,
        { localId, text, createdAt: new Date().toISOString(), status: "sending", errorReason: null, request },
      ])
      void resolvePending(localId, request)
    },
    [resolvePending]
  )

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      enqueue(trimmed, () => sendLeadMessage(leadId, trimmed))
    },
    [leadId, enqueue]
  )

  const sendTemplate = useCallback(
    (conversationId: number, templateLabel: string, templateKey: string, templateVars: Record<string, string>) => {
      enqueue(`Plantilla enviada: ${templateLabel}`, () => sendConversationTemplate(conversationId, templateKey, templateVars))
    },
    [enqueue]
  )

  const retry = useCallback(
    (localId: string) => {
      const item = pending.find((p) => p.localId === localId)
      if (!item) return
      setPending((prev) => prev.map((p) => (p.localId === localId ? { ...p, status: "sending", errorReason: null } : p)))
      void resolvePending(localId, item.request)
    },
    [pending, resolvePending]
  )

  const dismiss = useCallback((localId: string) => {
    setPending((prev) => prev.filter((p) => p.localId !== localId))
  }, [])

  return { pending, send, sendTemplate, retry, dismiss }
}
