import { apiFetch } from "@/lib/api-client"
import type { Lead, PaginatedResponse } from "@/lib/types"

export type LeadsScope = "all" | "archived" | "handoff"

export interface FetchLeadsParams {
  scope?: LeadsScope
  q?: string
}

export function fetchLeads(params: FetchLeadsParams = {}): Promise<PaginatedResponse<Lead>> {
  const search = new URLSearchParams()
  if (params.scope) search.set("scope", params.scope)
  if (params.q) search.set("q", params.q)
  const qs = search.toString()
  return apiFetch<PaginatedResponse<Lead>>(`/api/sales/leads/${qs ? `?${qs}` : ""}`)
}
