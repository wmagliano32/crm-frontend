import { apiFetch } from "@/lib/api-client"
import type { EtiquetaSeguimiento, Lead, LeadStage, LeadUpdatePayload, MotivoPerdida, PaginatedResponse } from "@/lib/types"

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

// Fase 2.8: archivar/desarchivar TOCA TODAS las conversaciones no
// eliminadas del lead a la vez (ver sales_ai/views.py
// _set_lead_conversations_archived) — no solo la actual. Un lead con
// historial de conversaciones viejas necesita eso para desaparecer de
// Pendientes/Todos de verdad, no solo de la vista superficial.
export function archiveLead(leadId: number): Promise<{ ok: boolean; archived: boolean; conversations_affected: number }> {
  return apiFetch(`/api/sales/leads/${leadId}/archive/`, { method: "POST" })
}

export function unarchiveLead(leadId: number): Promise<{ ok: boolean; archived: boolean; conversations_affected: number }> {
  return apiFetch(`/api/sales/leads/${leadId}/unarchive/`, { method: "POST" })
}

// motivoDetalle solo se manda (y solo importa) cuando motivo es "OTRO" —
// el backend lo exige en ese caso y lo ignora en cualquier otro.
export function markLeadLost(
  leadId: number,
  motivo: MotivoPerdida,
  motivoDetalle?: string
): Promise<{ ok: boolean; stage: LeadStage; motivo_perdida: MotivoPerdida; motivo_perdida_detalle: string }> {
  return apiFetch(`/api/sales/leads/${leadId}/mark-lost/`, {
    method: "POST",
    body: { motivo, motivo_detalle: motivoDetalle ?? "" },
  })
}

// Vuelve a PITCH y limpia motivo_perdida/motivo_perdida_detalle (mismo
// punto de recuperación que reactivar desde OPTED_OUT).
export function reopenLead(leadId: number): Promise<{ ok: boolean; stage: LeadStage }> {
  return apiFetch(`/api/sales/leads/${leadId}/reopen/`, { method: "POST" })
}

// ADMIN_CRM only (403 para el resto) — soft-delete propio del Lead, sin
// undo desde la UI.
export function deleteLead(leadId: number): Promise<{ ok: boolean; deleted: boolean }> {
  return apiFetch(`/api/sales/leads/${leadId}/delete/`, { method: "POST" })
}

// Fase 2.11: compartido por lead (no por empleado) — cualquier CRM
// activo puede llamarlo, se dispara al abrir el hilo.
export function markLeadRead(leadId: number): Promise<{ ok: boolean; last_read_at: string }> {
  return apiFetch(`/api/sales/leads/${leadId}/mark-read/`, { method: "POST" })
}

// Urgente, Paso 0 aprobado: única forma de que el bot vuelva a hablar en
// la conversación OPEN actual del lead — nada lo reactiva solo.
export function reactivateBot(leadId: number): Promise<{ ok: boolean; bot_paused: boolean }> {
  return apiFetch(`/api/sales/leads/${leadId}/reactivate-bot/`, { method: "POST" })
}

// Fase 3.1, diseño aprobado: opuesto del punto azul de "esperando
// respuesta" — compartido por lead (mismo criterio que mark-read). Se
// limpia solo en el backend cuando llega un mensaje entrante nuevo, no
// hay "desmarcar" manual.
export function markLeadResolved(leadId: number): Promise<{ ok: boolean; resuelto_at: string }> {
  return apiFetch(`/api/sales/leads/${leadId}/mark-resolved/`, { method: "POST" })
}
