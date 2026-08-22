import { apiFetch } from "@/lib/api-client"
import type { MessageThreadPage } from "@/lib/types"

export interface FetchLeadMessagesParams {
  before?: string
  // Fase 2.11.1: para el polling del hilo abierto — trae solo los
  // mensajes con id > afterId, sin repaginar desde el principio.
  afterId?: number
  limit?: number
}

export function fetchLeadMessages(leadId: number, params: FetchLeadMessagesParams = {}): Promise<MessageThreadPage> {
  const search = new URLSearchParams()
  if (params.before) search.set("before", params.before)
  if (params.afterId !== undefined) search.set("after_id", String(params.afterId))
  if (params.limit) search.set("limit", String(params.limit))
  const qs = search.toString()
  return apiFetch<MessageThreadPage>(`/api/sales/leads/${leadId}/messages/${qs ? `?${qs}` : ""}`)
}
