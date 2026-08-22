import { apiFetch } from "@/lib/api-client"
import type { CreateMeetingPayload, CreateMeetingResponse, Meeting, WaSendResult } from "@/lib/types"

export interface FetchMeetingsParams {
  leadId?: number
  showAll?: boolean
}

// show_all=1 siempre (Fase 2.12): la Vista tiene que poder mostrar
// canceladas/pasadas ("estado: agendada, realizada, cancelada" es un
// requisito explícito) — el default de MeetingViewSet.get_queryset (solo
// SCHEDULED/CONFIRMED) es para otros consumidores, no para esta vista.
export function fetchMeetings(params: FetchMeetingsParams = {}): Promise<Meeting[]> {
  const search = new URLSearchParams({ show_all: "1" })
  if (params.leadId !== undefined) search.set("lead_id", String(params.leadId))
  return apiFetch<Meeting[]>(`/api/sales/meetings/?${search.toString()}`)
}

export function createMeeting(payload: CreateMeetingPayload): Promise<CreateMeetingResponse> {
  return apiFetch<CreateMeetingResponse>("/api/sales/meetings/", { method: "POST", body: payload })
}

export interface CancelMeetingResponse {
  ok: boolean
  meeting: Meeting
  wa: WaSendResult | null
}

export function cancelMeeting(meetingId: number, notificar: boolean): Promise<CancelMeetingResponse> {
  return apiFetch<CancelMeetingResponse>(`/api/sales/meetings/${meetingId}/cancel/`, {
    method: "POST",
    body: { notificar },
  })
}

export function retryMeetingLink(meetingId: number): Promise<{ ok: boolean; queued: boolean }> {
  return apiFetch(`/api/sales/meetings/${meetingId}/retry-link/`, { method: "POST" })
}

export function setMeetingLink(meetingId: number, meetingUrl: string): Promise<{ ok: boolean; meeting: Meeting }> {
  return apiFetch(`/api/sales/meetings/${meetingId}/set-link/`, {
    method: "PATCH",
    body: { meeting_url: meetingUrl },
  })
}
