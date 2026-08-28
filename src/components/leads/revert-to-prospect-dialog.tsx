import { useSearchParams } from "react-router-dom"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useRevertLeadToProspect } from "@/hooks/use-lead-actions"

interface RevertToProspectDialogProps {
  leadId: number
  leadName: string
  // Para decir de quién se desvincula. Viene del lead
  // (usuario_convertido_nombre), no del catálogo: un usuario desvinculable
  // puede no estar en ninguna búsqueda.
  usuarioNombre: string | null
  usuarioOrganizacion: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Fase 3.6: la inversa de convertir. Se confirma porque el efecto no es
// cosmético — el bot vuelve a tratarlo como prospecto y puede volver a
// escribirle ofreciendo demos.
export function RevertToProspectDialog({
  leadId,
  leadName,
  usuarioNombre,
  usuarioOrganizacion,
  open,
  onOpenChange,
}: RevertToProspectDialogProps) {
  const mutation = useRevertLeadToProspect(leadId)
  // Inverso de la conversión: el lead vuelve a Prospectos y el segmento lo
  // sigue (ver ConvertToClientDialog).
  const [searchParams, setSearchParams] = useSearchParams()

  function handleOpenChange(next: boolean) {
    if (!next) mutation.reset()
    onOpenChange(next)
  }

  function handleConfirm() {
    mutation.mutate(undefined, {
      onSuccess: () => {
        const params = new URLSearchParams(searchParams)
        params.delete("segmento")
        setSearchParams(params, { replace: true })
        handleOpenChange(false)
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Revertir a prospecto</AlertDialogTitle>
          <AlertDialogDescription>
            {leadName} vuelve a la bandeja de prospectos y{" "}
            <strong>el bot vuelve a tratarlo como tal</strong>: puede escribirle ofreciendo demos.
            {usuarioNombre ? (
              <>
                {" "}
                Se desvincula de <strong>{usuarioNombre}</strong>
                {usuarioOrganizacion ? ` (${usuarioOrganizacion})` : ""}.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive">No se pudo revertir. Probá de nuevo.</p>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={mutation.isPending}>
            {mutation.isPending ? "Revirtiendo…" : "Revertir a prospecto"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
