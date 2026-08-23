// Fase 2.10, Frente 3 (backend, sales_ai/views.py): límites reales de
// WhatsApp por categoría, no un tope fijo. Espejo exacto de
// SALES_ATTACHMENT_MAX_BYTES_BY_CATEGORY / SALES_ATTACHMENT_ALLOWED_TYPES
// — solo para adjuntos SALIENTES (lo que un agente adjunta a mano acá).
// Los adjuntos ENTRANTES no tienen whitelist (ver ThreadAttachmentPreview,
// que clasifica por prefijo de content_type, no por esta lista).
export const ATTACHMENT_MAX_BYTES_BY_CATEGORY = {
  image: 5 * 1024 * 1024,
  audio_video: 16 * 1024 * 1024,
  document: 100 * 1024 * 1024,
} as const

export type AttachmentCategory = keyof typeof ATTACHMENT_MAX_BYTES_BY_CATEGORY

export const SALES_ATTACHMENT_ALLOWED_TYPES: Record<string, AttachmentCategory> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "audio/ogg": "audio_video",
  "audio/mpeg": "audio_video",
  "audio/mp4": "audio_video",
  "audio/amr": "audio_video",
  "video/mp4": "audio_video",
  "video/3gpp": "audio_video",
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-excel": "document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "document",
  "text/plain": "document",
}

// Mismo mensaje que _validate_sales_attachment en el backend, para que el
// usuario vea exactamente el mismo error si por lo que sea el chequeo del
// cliente no alcanzara a bloquear el envío. Se valida ANTES de subir —
// nunca esperar a la respuesta del servidor para mostrar esto.
export function validateAttachment(file: File): string | null {
  const category = SALES_ATTACHMENT_ALLOWED_TYPES[file.type]
  if (!category) return "Tipo de archivo no permitido para el chat comercial."
  const maxBytes = ATTACHMENT_MAX_BYTES_BY_CATEGORY[category]
  if (file.size > maxBytes) {
    const maxMb = Math.floor(maxBytes / (1024 * 1024))
    return `El archivo supera el tamaño máximo permitido de ${maxMb} MB para este tipo de adjunto.`
  }
  return null
}
