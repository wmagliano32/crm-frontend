export type CrmRol = "ADMIN_CRM" | "COMERCIAL" | "SOPORTE"

export interface CrmMe {
  id: number
  username: string
  email: string
  crm_usuario_id: number
  crm_rol: CrmRol
  activo: boolean
}

export interface CrmLoginResponse {
  access: string
  refresh: string
  role: "CRM"
  crm_rol: CrmRol
  crm_usuario_id: number
}

// Vocabulario cerrado de sales_ai.models.EtiquetaSeguimiento (backend).
export type EtiquetaSeguimiento =
  | "RESPONDER_HOY"
  | "ESPERANDO_CLIENTE"
  | "PIDIO_PRECIO"
  | "DEMO_AGENDADA"
  | "TRABADO"
  | "SIN_DATOS"

export type LeadStage =
  | "NEW"
  | "QUALIFY"
  | "PITCH"
  | "SCHEDULING"
  | "BOOKED"
  | "HANDOFF"
  | "OPTED_OUT"
  | "CLOSED"

// GET /api/sales/leads/ — campos confirmados contra producción (Fase 2.1,
// Paso 0). last_message_direction viene en MAYÚSCULAS ("IN"/"OUT").
export interface Lead {
  id: number
  phone_e164: string
  name: string
  email: string
  company: string
  role: string
  city: string
  consorcios_count: number | null
  units_count: number | null
  current_system: string
  main_pain: string
  tags: string[]
  etiquetas_seguimiento: EtiquetaSeguimiento[]
  es_cliente: boolean
  stage: LeadStage
  score: number
  last_inbound_at: string | null
  last_outbound_at: string | null
  opted_out_at: string | null
  created_at: string
  updated_at: string
  last_message_text: string | null
  // Texto del último mensaje puntualmente ENTRANTE (lo que dijo el lead),
  // distinto de last_message_text (que casi siempre es la respuesta del
  // bot). null si el lead nunca escribió.
  last_inbound_text: string | null
  last_message_direction: "IN" | "OUT" | null
  last_message_at: string | null
  current_conversation_id: number | null
  // FK a User (no a UsuarioCRM) — ver sales_ai/views.py LeadViewSet.get_queryset.
  assigned_to_id: number | null
  assigned_to_name: string | null
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
