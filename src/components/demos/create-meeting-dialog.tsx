import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useCreateMeeting } from "@/hooks/use-meetings"
import { apiErrorMessage } from "@/lib/api-client"

// Datetime-local no trae segundos ni timezone — new Date(value) lo
// interpreta en la timezone LOCAL del navegador, que es lo que queremos
// (el admin agenda en su propia hora, igual que el resto de la app).
function toIsoOrNull(datetimeLocalValue: string): string | null {
  if (!datetimeLocalValue) return null
  const dt = new Date(datetimeLocalValue)
  if (Number.isNaN(dt.getTime())) return null
  return dt.toISOString()
}

export function CreateMeetingDialog({ leadId, leadEmail }: { leadId: number; leadEmail: string }) {
  const [open, setOpen] = useState(false)
  const [scheduledAt, setScheduledAt] = useState("")
  const [duration, setDuration] = useState("20")
  const [email, setEmail] = useState("")
  const [notificar, setNotificar] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const createMutation = useCreateMeeting()

  function reset() {
    setScheduledAt("")
    setDuration("20")
    setEmail("")
    setNotificar(true)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const iso = toIsoOrNull(scheduledAt)
    if (!iso) {
      setError("Elegí una fecha y hora.")
      return
    }
    createMutation.mutate(
      {
        lead_id: leadId,
        scheduled_at: iso,
        duration_minutes: Number(duration) || 20,
        email: leadEmail ? undefined : email || undefined,
        notificar,
      },
      {
        onSuccess: () => {
          setOpen(false)
          reset()
        },
        onError: (err) => setError(apiErrorMessage(err, "No se pudo agendar la demo.")),
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">Agendar demo</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Agendar demo</DialogTitle>
            <DialogDescription>Crea el evento en Google Calendar y, si querés, le avisa al lead por WhatsApp.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1">
            <label htmlFor="cm-scheduled-at" className="text-xs font-medium text-muted-foreground">
              Fecha y hora
            </label>
            <Input
              id="cm-scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="cm-duration" className="text-xs font-medium text-muted-foreground">
              Duración (minutos)
            </label>
            <Input
              id="cm-duration"
              type="number"
              min={5}
              max={180}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {!leadEmail && (
            <div className="flex flex-col gap-1">
              <label htmlFor="cm-email" className="text-xs font-medium text-muted-foreground">
                Email del lead (para la invitación de Calendar)
              </label>
              <Input id="cm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="opcional" />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={notificar} onCheckedChange={(checked) => setNotificar(checked === true)} />
            Avisarle al lead por WhatsApp
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Agendando…" : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
