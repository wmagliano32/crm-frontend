export type CrmRol = "ADMIN_CRM" | "COMERCIAL" | "SOPORTE"

export interface CrmMe {
  id: number
  username: string
  email: string
  crm_usuario_id: number
  crm_rol: CrmRol
  activo: boolean
  // Fase 2.9: clave pública VAPID, no secreta — el navegador la necesita
  // para pushManager.subscribe(). Viaja acá para no sumar un endpoint
  // aparte solo para una constante.
  vapid_public_key: string
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

// Vocabulario cerrado de sales_ai.models.MotivoPerdida (Fase 2.8).
export type MotivoPerdida =
  | "PRECIO"
  | "COMPETENCIA"
  | "MUY_CHICO"
  | "NO_RESPONDIO"
  | "NO_ERA_EL_MOMENTO"
  | "OTRO"

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
  // Fase 2.8: obligatorio al marcar el lead como perdido (stage=CLOSED
  // vía mark-lost) — motivo_perdida_detalle solo tiene contenido cuando
  // motivo_perdida es "OTRO". Ambos null/"" para leads CLOSED de antes
  // de esta fase (sin migración de datos que lo invente) y para
  // cualquier lead que nunca se marcó como perdido.
  motivo_perdida: MotivoPerdida | null
  motivo_perdida_detalle: string
  score: number
  last_inbound_at: string | null
  last_outbound_at: string | null
  // Fase 2.11: compartido por lead, no por empleado — si cualquiera del
  // equipo abre el hilo, queda "leído" para todos. `unread` es
  // computado por el backend (last_inbound_at vs. last_read_at), no
  // hace falta rederivarlo acá.
  last_read_at: string | null
  unread: boolean
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
  // Fase 2.8: computado (no un campo propio del modelo) — true cuando
  // TODAS las conversaciones no eliminadas del lead están archivadas.
  is_archived: boolean
  // Commit E los agregó al modelo; sumados al serializer en la Fase 2.5.
  // La ficha de cliente completa (consorcios, UF, última liquidación) es
  // una fase aparte — esto es solo lo mínimo para no ocultar el estado.
  usuario_convertido_id: number | null
  fecha_conversion: string | null
}

// Campos de contacto/calificación editables desde la ficha del lead
// (Fase 2.5) — PATCH /api/sales/leads/{id}/. Coincide con
// LeadUpdateSerializer del backend: stage tiene su propio endpoint
// (set-stage), etiquetas_seguimiento el suyo (Fase 2.3), y es_cliente/
// usuario_convertido no se editan por acá.
export type LeadUpdatePayload = Partial<
  Pick<Lead, "name" | "email" | "company" | "role" | "city" | "consorcios_count" | "units_count" | "current_system" | "main_pain" | "score">
>

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type MessageDirection = "IN" | "OUT"
export type DeliveryStatus = "" | "queued" | "sent" | "delivered" | "read" | "failed"

export interface MessageAttachment {
  id: number
  file_name: string
  content_type: string
  size_bytes: number
  created_at: string
  download_url: string
}

// GET /api/sales/leads/{id}/messages/ (Fase 2.2, Paso 0 aprobado — opción
// B). Mismo shape que el Message del backend, más conversation (para
// dibujar los separadores de reenganche entre conversaciones del mismo
// lead) y conversacion_eliminada (la conversación de origen tiene
// is_deleted=True — decisión explícita de incluirla igual, atenuada, en
// vez de dejar un agujero invisible en la charla).
export interface ThreadMessage {
  id: number
  conversation: number
  direction: MessageDirection
  text: string
  provider: string
  provider_message_id: string
  delivery_status: DeliveryStatus
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  failed_at: string | null
  error_code: string
  error_message: string
  // Sin tipo cerrado a propósito: es donde vive la convención
  // payload.source === "inbox" que distingue humano de bot (ver
  // lib/thread-format.ts isHumanOutbound), no un contrato documentado del
  // backend.
  payload: Record<string, unknown>
  attachments: MessageAttachment[]
  created_at: string
  conversacion_eliminada: boolean
}

export interface MessageThreadPage {
  results: ThreadMessage[]
  next_cursor: string | null
  has_more: boolean
}

// Respuesta de assign/unassign (ConversationSerializer completo). No se
// usa para renderizar el hilo (eso lo cubre ThreadMessage/lead-thread) —
// solo para reconciliar el estado de asignación tras la mutación.
export interface Conversation {
  id: number
  lead: number
  status: "OPEN" | "CLOSED"
  assigned_to: number | null
  assigned_to_name: string | null
  assigned_at: string | null
  assigned_by: number | null
  assigned_by_name: string | null
  is_archived: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

// GET /crm/empleados/ (Fase 2.3, Paso 0 aprobado: list/retrieve relajado a
// IsCrmUser — antes solo ADMIN_CRM podía verlo, y un COMERCIAL necesita el
// listado para poder asignar). id es el de UsuarioCRM; user_id es el de
// User, el que espera assign() y el que trae Lead.assigned_to_id — son
// espacios de ids distintos, no intercambiables.
export interface Empleado {
  id: number
  user_id: number
  username: string
  email: string
  nombre: string
  apellido: string
  rol: CrmRol
  activo: boolean
  created_at: string
  updated_at: string
}

export interface TemplateVariable {
  key: string
  label: string
  required: boolean
}

// GET /api/sales/conversations/templates/. Hoy en producción devuelve
// UNA sola plantilla (la fija por settings) — el resto del catálogo
// (twilio_plantillas) tiene un bug de scoping heredado del modelo
// multi-tenant (created_by/main_user, que no aplica a usuarios CRM) y
// queda fuera. No se corrige en esta fase (Paso 0, Fase 2.3) — el tipo
// modela el contrato completo para no tener que tocarlo cuando se arregle.
export interface SalesTemplate {
  key: string
  label: string
  description: string
  template_sid: string
  source: string
  enabled: boolean
  preview_text: string
  variables: TemplateVariable[]
}

// Resultado de intentar mandar por Twilio (sales_ai/services/whatsapp_smart.py).
// wa.ok en false NO es un error HTTP — la request a /send/ puede devolver
// 200 con wa.ok=false (ej. fuera de ventana de 24h, error 63016 de Twilio).
export interface WaSendResult {
  ok: boolean
  mode?: string
  sid?: string
  error?: string
  code?: number | string | null
  detail?: string
  template_used?: boolean
}

// POST /api/sales/leads/{id}/send/ y /api/sales/conversations/{id}/send-template/.
// "ok" de raíz es SIEMPRE true si la request se procesó (el mensaje se creó
// en la base) — NUNCA usarlo para decidir si el WhatsApp salió. Mirar
// wa?.ok (puede ser null si text vino vacío, ej. solo adjunto).
export interface SendMessageResponse {
  ok: boolean
  wa: WaSendResult | null
  message: Omit<ThreadMessage, "conversacion_eliminada">
}
