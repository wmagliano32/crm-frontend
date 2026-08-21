import { apiFetch } from "@/lib/api-client"
import type { EtiquetaSeguimiento, Lead, LeadStage, LeadUpdatePayload, PaginatedResponse } from "@/lib/types"

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

export function fetchLead(id: number): Promise<Lead> {
  return apiFetch<Lead>(`/api/sales/leads/${id}/`)
}

interface EtiquetaMutationResponse {
  ok: boolean
  etiquetas_seguimiento: EtiquetaSeguimiento[]
}

// Uno solo por request — el backend rechaza (400) si vienen los dos o
// ninguno (sales_ai/views.py LeadViewSet.etiquetas, Fase 2.3).
export function addLeadEtiqueta(leadId: number, etiqueta: EtiquetaSeguimiento): Promise<EtiquetaMutationResponse> {
  return apiFetch(`/api/sales/leads/${leadId}/etiquetas/`, { method: "POST", body: { add: etiqueta } })
}

export function removeLeadEtiqueta(leadId: number, etiqueta: EtiquetaSeguimiento): Promise<EtiquetaMutationResponse> {
  return apiFetch(`/api/sales/leads/${leadId}/etiquetas/`, { method: "POST", body: { remove: etiqueta } })
}

export function handoffLead(leadId: number): Promise<{ ok: boolean }> {
  return apiFetch(`/api/sales/leads/${leadId}/handoff/`, { method: "POST" })
}

// PATCH real sobre el recurso (Fase 2.5) — el backend devuelve la lectura
// completa (LeadSerializer), no un eco del payload de escritura, así que
// esto ya sirve para actualizar la caché sin un GET aparte.
export function updateLead(leadId: number, patch: LeadUpdatePayload): Promise<Lead> {
  return apiFetch<Lead>(`/api/sales/leads/${leadId}/`, { method: "PATCH", body: patch })
}

export function setLeadStage(leadId: number, stage: LeadStage): Promise<{ ok: boolean; stage: LeadStage }> {
  return apiFetch(`/api/sales/leads/${leadId}/set-stage/`, { method: "POST", body: { stage } })
}
