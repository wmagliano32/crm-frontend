import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useDeleteLead } from "@/hooks/use-lead-actions"

interface DeleteLeadAlertProps {
  leadId: number
  leadName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  // Fase 2.8: eliminar un lead saca al usuario del hilo si lo tenía
  // abierto (deja de existir, un GET posterior da 404) — solo hace
  // falta cuando se elimina desde la cabecera del hilo, no desde la fila
  // de la lista.
  onDeleted?: () => void
}

// Confirmación explícita ANTES de ejecutar (Fase 2.8, Paso 0 aprobado) —
// "basura real": pruebas, números equivocados, spam. Sin undo desde la
// UI a propósito, no se pidió.
export function DeleteLeadAlert({ leadId, leadName, open, onOpenChange, onDeleted }: DeleteLeadAlertProps) {
  const mutation = useDeleteLead(leadId)

  function handleConfirm(e: React.MouseEvent) {
    e.preventDefault()
    mutation.mutate(undefined, {
      onSuccess: () => {
        onOpenChange(false)
        onDeleted?.()
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar {leadName || "este lead"}</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es permanente. El lead deja de aparecer en cualquier vista de la bandeja.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {mutation.isError && <p className="text-sm text-destructive">No se pudo eliminar. Probá de nuevo.</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Eliminando…" : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
