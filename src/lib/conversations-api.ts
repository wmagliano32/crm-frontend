import { apiFetch } from "@/lib/api-client"
import type { Conversation, SalesTemplate, SendMessageResponse } from "@/lib/types"

export function fetchTemplates(): Promise<SalesTemplate[]> {
  return apiFetch<SalesTemplate[]>("/api/sales/conversations/templates/")
}

export function assignConversation(conversationId: number, userId: number): Promise<{ ok: boolean; conversation: Conversation }> {
  return apiFetch(`/api/sales/conversations/${conversationId}/assign/`, {
    method: "POST",
    body: { user_id: userId },
  })
}

export function unassignConversation(conversationId: number): Promise<{ ok: boolean; conversation: Conversation }> {
  return apiFetch(`/api/sales/conversations/${conversationId}/unassign/`, { method: "POST" })
}

// POST /api/sales/leads/{id}/send/ — a propósito la versión por LEAD, no
// por conversación: resuelve sola la conversación OPEN (o crea una si no
// hay), así el frontend no necesita rastrear un conversation_id para
// mandar texto libre (Fase 2.2 ya organiza todo por lead, no por
// conversación puntual).
export function sendLeadMessage(leadId: number, text: string): Promise<SendMessageResponse> {
  return apiFetch<SendMessageResponse>(`/api/sales/leads/${leadId}/send/`, {
    method: "POST",
    body: { text },
  })
}

export function sendConversationTemplate(
  conversationId: number,
  templateKey: string,
  templateVars: Record<string, string>
): Promise<SendMessageResponse> {
  return apiFetch<SendMessageResponse>(`/api/sales/conversations/${conversationId}/send-template/`, {
    method: "POST",
    body: { template_key: templateKey, template_vars: templateVars },
  })
}
