import { useMutation, useQueryClient } from "@tanstack/react-query"
import { assignLead, unassignLead } from "@/lib/conversations-api"
import { addLeadEtiqueta, handoffLead, removeLeadEtiqueta, setLeadStage, updateLead } from "@/lib/leads-api"
import type { EtiquetaSeguimiento, LeadStage, LeadUpdatePayload } from "@/lib/types"

// Asignación/etiquetas/stage se ven tanto en la cabecera del hilo como en
// la lista de la bandeja (avatar de asignado, pills de etiquetas) —
// invalidar las dos.
function useInvalidateLead(leadId: number) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ["lead", leadId] })
    queryClient.invalidateQueries({ queryKey: ["leads"] })
  }
}

// userId null → desasignar. Nunca se usa el default de "sin user_id =
// asignarme a mí" que tiene el backend: la cabecera siempre manda un id
// explícito (el que se eligió en el selector, "Sin asignar" incluido).
//
// SIEMPRE por lead (Fase 2.6), nunca por conversación — ya no hace falta
// un conversationId ni chequear si existe: el endpoint por lead resuelve
// o crea la conversación OPEN solo. Antes esto quedaba inutilizable para
// un lead que nunca escribió (current_conversation_id null, ej. un
// cliente recién importado) — un solo camino, sin esa rama.
export function useAssignConversation(leadId: number) {
  const invalidate = useInvalidateLead(leadId)
  return useMutation({
    mutationFn: (userId: number | null) => (userId === null ? unassignLead(leadId) : assignLead(leadId, userId)),
    onSuccess: invalidate,
  })
}

export function useLeadEtiquetaMutation(leadId: number) {
  const invalidate = useInvalidateLead(leadId)
  return useMutation({
    mutationFn: (params: { etiqueta: EtiquetaSeguimiento; action: "add" | "remove" }) =>
      params.action === "add"
        ? addLeadEtiqueta(leadId, params.etiqueta)
        : removeLeadEtiqueta(leadId, params.etiqueta),
    onSuccess: invalidate,
  })
}

export function useHandoffLead(leadId: number) {
  const invalidate = useInvalidateLead(leadId)
  return useMutation({
    mutationFn: () => handoffLead(leadId),
    onSuccess: invalidate,
  })
}

export function useSetLeadStage(leadId: number) {
  const invalidate = useInvalidateLead(leadId)
  return useMutation({
    mutationFn: (stage: LeadStage) => setLeadStage(leadId, stage),
    onSuccess: invalidate,
  })
}

// El PATCH devuelve la lectura completa (LeadSerializer) — se escribe
// directo en la caché de ["lead", leadId] en vez de solo invalidar, así
// el campo recién editado no "parpadea" esperando un refetch.
export function useUpdateLead(leadId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: LeadUpdatePayload) => updateLead(leadId, patch),
    onSuccess: (updatedLead) => {
      queryClient.setQueryData(["lead", leadId], updatedLead)
      queryClient.invalidateQueries({ queryKey: ["leads"] })
    },
  })
}
