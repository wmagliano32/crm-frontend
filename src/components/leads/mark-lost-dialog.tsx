import { useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SelectNative } from "@/components/ui/select-native"
import { Textarea } from "@/components/ui/textarea"
import { useMarkLeadLost } from "@/hooks/use-lead-actions"
import { ALL_MOTIVOS_PERDIDA, motivoPerdidaLabel } from "@/lib/lead-format"
import type { MotivoPerdida } from "@/lib/types"

interface MarkLostDialogProps {
  leadId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Fase 2.8, Paso 0 aprobado: motivo obligatorio, con el campo de texto
// libre apareciendo SOLO si se elige "Otro" — mismo requisito que el
// backend valida (mark-lost 400 sin motivo, o con OTRO sin detalle).
// Usa AlertDialog en vez de Dialog a propósito (Walter solo aprobó
// agregar DropdownMenu y AlertDialog): el formulario cabe perfectamente
// adentro, y el botón de confirmar es un <Button> normal (no
// AlertDialogAction) porque necesita quedar deshabilitado hasta que el
// formulario sea válido y NO cerrar el modal si el POST falla.
export function MarkLostDialog({ leadId, open, onOpenChange }: MarkLostDialogProps) {
  const [motivo, setMotivo] = useState<MotivoPerdida | "">("")
  const [detalle, setDetalle] = useState("")
  const mutation = useMarkLeadLost(leadId)

  function handleOpenChange(next: boolean) {
    if (!next) {
      setMotivo("")
      setDetalle("")
      mutation.reset()
    }
    onOpenChange(next)
  }

  function handleConfirm() {
    if (!motivo) return
    if (motivo === "OTRO" && !detalle.trim()) return
    mutation.mutate(
      { motivo, motivoDetalle: motivo === "OTRO" ? detalle.trim() : undefined },
      { onSuccess: () => handleOpenChange(false) }
    )
  }

  const canConfirm = motivo !== "" && (motivo !== "OTRO" || detalle.trim().length > 0)

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Marcar como perdido</AlertDialogTitle>
          <AlertDialogDescription>
            El lead pasa a Cerrado y sale de Pendientes. Elegí el motivo para que quede registrado.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="motivo-perdida">Motivo</Label>
            <SelectNative
              id="motivo-perdida"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as MotivoPerdida | "")}
            >
              <option value="" disabled>
                Elegí un motivo…
              </option>
              {ALL_MOTIVOS_PERDIDA.map((value) => (
                <option key={value} value={value}>
                  {motivoPerdidaLabel(value)}
                </option>
              ))}
            </SelectNative>
          </div>

          {motivo === "OTRO" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="motivo-detalle">Detalle</Label>
              <Textarea
                id="motivo-detalle"
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                placeholder="Contá brevemente por qué se perdió…"
                rows={3}
              />
            </div>
          )}

          {mutation.isError && <p className="text-sm text-destructive">No se pudo marcar como perdido. Probá de nuevo.</p>}
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm || mutation.isPending}>
            {mutation.isPending ? "Guardando…" : "Marcar como perdido"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
