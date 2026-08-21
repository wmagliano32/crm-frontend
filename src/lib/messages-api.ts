import { apiFetch } from "@/lib/api-client"
import type { MessageThreadPage } from "@/lib/types"

export interface FetchLeadMessagesParams {
  before?: string
  limit?: number
}

export function fetchLeadMessages(leadId: number, params: FetchLeadMessagesParams = {}): Promise<MessageThreadPage> {
  const search = new URLSearchParams()
  if (params.before) search.set("before", params.before)
  if (params.limit) search.set("limit", String(params.limit))
  const qs = search.toString()
  return apiFetch<MessageThreadPage>(`/api/sales/leads/${leadId}/messages/${qs ? `?${qs}` : ""}`)
}
