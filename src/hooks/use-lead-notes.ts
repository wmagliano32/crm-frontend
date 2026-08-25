import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createLeadNote, deleteLeadNote, fetchLeadNotes, updateLeadNote } from "@/lib/leads-api"

// Fase 3.2, diseño aprobado: notas INTERNAS por lead. invalidateQueries de
// ["leads"] en las 3 mutaciones porque notes_count (el indicador de la
// fila) vive en el mismo LeadSerializer que alimenta la lista -- mismo
// criterio que unread/resuelto_at en las fases anteriores.
export function useLeadNotes(leadId: number) {
  return useQuery({
    queryKey: ["lead-notes", leadId],
    queryFn: () => fetchLeadNotes(leadId),
  })
}

function useInvalidateNotes(leadId: number) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ["lead-notes", leadId] })
    queryClient.invalidateQueries({ queryKey: ["lead", leadId] })
    queryClient.invalidateQueries({ queryKey: ["leads"] })
  }
}

export function useCreateLeadNote(leadId: number) {
  const invalidate = useInvalidateNotes(leadId)
  return useMutation({
    mutationFn: (text: string) => createLeadNote(leadId, text),
    onSuccess: invalidate,
  })
}

export function useUpdateLeadNote(leadId: number) {
  const invalidate = useInvalidateNotes(leadId)
  return useMutation({
    mutationFn: (params: { noteId: number; text: string }) => updateLeadNote(leadId, params.noteId, params.text),
    onSuccess: invalidate,
  })
}

export function useDeleteLeadNote(leadId: number) {
  const invalidate = useInvalidateNotes(leadId)
  return useMutation({
    mutationFn: (noteId: number) => deleteLeadNote(leadId, noteId),
    onSuccess: invalidate,
  })
}
