import { apiFetch, apiFetchMultipart } from "@/lib/api-client"
import type { Conversation, SalesTemplate, SendMessageResponse } from "@/lib/types"

export function fetchTemplates(leadId: number): Promise<SalesTemplate[]> {
  return apiFetch<SalesTemplate[]>(`/api/sales/conversations/templates/?lead=${leadId}`)
}

// Los tres siguientes son SIEMPRE por LEAD, nunca por conversación (Fase
// 2.6): resuelven o CREAN la conversación OPEN del lead solas, mismo
// patrón que sendLeadMessage ya usaba desde la 2.2/2.3. Antes existían
// dos caminos (por lead si current_conversation_id, por conversación si
// no) — un lead que nunca escribió (ej. un cliente recién importado)
// tiene current_conversation_id null, así que la mitad de las veces se
// necesitaba el camino "por conversación" con un id que no existía
// todavía. Usar siempre el de lead evita esa rama: el comportamiento es
// idéntico cuando la conversación ya existe (la reusa en vez de crear
// otra), y funciona igual cuando no existe.
export function assignLead(leadId: number, userId: number): Promise<{ ok: boolean; conversation: Conversation }> {
  return apiFetch(`/api/sales/leads/${leadId}/assign/`, {
    method: "POST",
    body: { user_id: userId },
  })
}

export function unassignLead(leadId: number): Promise<{ ok: boolean; conversation: Conversation }> {
  return apiFetch(`/api/sales/leads/${leadId}/unassign/`, { method: "POST" })
}

export function sendLeadTemplate(
  leadId: number,
  templateKey: string,
  templateVars: Record<string, string>
): Promise<SendMessageResponse> {
  return apiFetch<SendMessageResponse>(`/api/sales/leads/${leadId}/send-template/`, {
    method: "POST",
    body: { template_key: templateKey, template_vars: templateVars },
  })
}

// POST /api/sales/leads/{id}/send/ — misma razón: resuelve sola la
// conversación OPEN (o crea una si no hay), así el frontend no necesita
// rastrear un conversation_id para mandar texto libre (Fase 2.2 ya
// organiza todo por lead, no por conversación puntual).
export function sendLeadMessage(leadId: number, text: string): Promise<SendMessageResponse> {
  return apiFetch<SendMessageResponse>(`/api/sales/leads/${leadId}/send/`, {
    method: "POST",
    body: { text },
  })
}

// Fase 2.10: mismo endpoint que sendLeadMessage, pero multipart — el
// backend acepta "attachment" como archivo (MultiPartParser, ver Paso 0
// de la fase). "text" puede venir vacío (adjunto solo).
export function sendLeadMessageWithAttachment(
  leadId: number,
  text: string,
  file: File,
  onProgress?: (fraction: number) => void
): Promise<SendMessageResponse> {
  return apiFetchMultipart<SendMessageResponse>(
    `/api/sales/leads/${leadId}/send/`,
    { text, attachment: file },
    onProgress
  )
}
