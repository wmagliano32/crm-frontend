import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { sendLeadMessage, sendLeadMessageWithAttachment, sendLeadTemplate } from "@/lib/conversations-api"
import type { SendMessageResponse, WaSendResult } from "@/lib/types"

export interface PendingMessage {
  localId: string
  text: string
  createdAt: string
  status: "sending" | "error"
  errorReason: string | null
  // Fase 2.10: solo se usa mientras se sube un adjunto (fetch no da
  // progreso, así que este campo viene de un XHR — ver api-client.ts).
  // null/undefined en cualquier otro envío.
  uploadProgress?: number | null
}

interface PendingRecord extends PendingMessage {
  request: (onProgress: (fraction: number) => void) => Promise<SendMessageResponse>
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
    async (localId: string, request: (onProgress: (fraction: number) => void) => Promise<SendMessageResponse>) => {
      const onProgress = (fraction: number) => {
        setPending((prev) => (prev.some((p) => p.localId === localId) ? prev.map((p) => (p.localId === localId ? { ...p, uploadProgress: fraction } : p)) : prev))
      }
      try {
        const resp = await request(onProgress)
        if (resp.wa && resp.wa.ok === false) {
          const reason = waErrorReason(resp.wa)
          setPending((prev) =>
            prev.map((p) => (p.localId === localId ? { ...p, status: "error", errorReason: reason, uploadProgress: null } : p))
          )
          return
        }
        setPending((prev) => prev.filter((p) => p.localId !== localId))
        queryClient.invalidateQueries({ queryKey: ["lead-thread", leadId] })
      } catch {
        setPending((prev) =>
          prev.map((p) =>
            p.localId === localId
              ? { ...p, status: "error", errorReason: "No se pudo enviar. Revisá tu conexión.", uploadProgress: null }
              : p
          )
        )
      }
    },
    [leadId, queryClient]
  )

  const enqueue = useCallback(
    (text: string, request: (onProgress: (fraction: number) => void) => Promise<SendMessageResponse>) => {
      const localId = `pending-${Date.now()}-${pendingIdCounter++}`
      setPending((prev) => [
        ...prev,
        { localId, text, createdAt: new Date().toISOString(), status: "sending", errorReason: null, uploadProgress: null, request },
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

  // Fase 2.10: mismo mecanismo optimista que send(), pero con progreso de
  // subida (uploadProgress) porque un archivo puede tardar. text puede
  // venir vacío -- adjunto solo, el mismo caso que ya soporta el backend
  // desde el Frente 2. El texto mostrado en la burbuja pendiente cae al
  // nombre del archivo cuando no hay texto, para no dejar la burbuja vacía.
  const sendAttachment = useCallback(
    (text: string, file: File) => {
      const trimmed = text.trim()
      const label = trimmed || `📎 ${file.name}`
      enqueue(label, (onProgress) => sendLeadMessageWithAttachment(leadId, trimmed, file, onProgress))
    },
    [leadId, enqueue]
  )

  // Siempre por lead (Fase 2.6) — el endpoint resuelve/crea la
  // conversación solo, ya no hace falta pasarle un conversationId.
  const sendTemplate = useCallback(
    (templateLabel: string, templateKey: string, templateVars: Record<string, string>) => {
      enqueue(`Plantilla enviada: ${templateLabel}`, () => sendLeadTemplate(leadId, templateKey, templateVars))
    },
    [leadId, enqueue]
  )

  const retry = useCallback(
    (localId: string) => {
      const item = pending.find((p) => p.localId === localId)
      if (!item) return
      setPending((prev) =>
        prev.map((p) => (p.localId === localId ? { ...p, status: "sending", errorReason: null, uploadProgress: null } : p))
      )
      void resolvePending(localId, item.request)
    },
    [pending, resolvePending]
  )

  const dismiss = useCallback((localId: string) => {
    setPending((prev) => prev.filter((p) => p.localId !== localId))
  }, [])

  return { pending, send, sendAttachment, sendTemplate, retry, dismiss }
}
