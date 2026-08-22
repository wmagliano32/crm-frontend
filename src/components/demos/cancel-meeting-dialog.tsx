import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useCancelMeeting } from "@/hooks/use-meetings"
import { apiErrorMessage } from "@/lib/api-client"
import { formatMeetingDateTime } from "@/lib/meeting-format"
import type { Meeting } from "@/lib/types"

export function CancelMeetingDialog({ meeting }: { meeting: Meeting }) {
  const [open, setOpen] = useState(false)
  const [notificar, setNotificar] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cancelMutation = useCancelMeeting()

  function handleConfirm() {
    setError(null)
    cancelMutation.mutate(
      { meetingId: meeting.id, notificar },
      {
        onSuccess: () => setOpen(false),
        onError: (err) => setError(apiErrorMessage(err, "No se pudo cancelar la demo.")),
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setError(null)
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cancelar esta demo?</DialogTitle>
          <DialogDescription>
            {meeting.lead.name || meeting.lead.phone_e164} · {formatMeetingDateTime(meeting.scheduled_at)}
          </DialogDescription>
        </DialogHeader>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={notificar} onCheckedChange={(checked) => setNotificar(checked === true)} />
          Avisarle al lead por WhatsApp
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Volver
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={cancelMutation.isPending}>
            {cancelMutation.isPending ? "Cancelando…" : "Cancelar demo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
