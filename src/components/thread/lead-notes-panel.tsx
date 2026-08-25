import { ChevronDown, ChevronUp, Pencil, StickyNote, Trash2 } from "lucide-react"
import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useCreateLeadNote, useDeleteLeadNote, useUpdateLeadNote, useLeadNotes } from "@/hooks/use-lead-notes"
import { useAuth } from "@/lib/auth-context"
import { formatRelativeTime } from "@/lib/lead-format"
import type { LeadInternalNote } from "@/lib/types"

function canEdit(note: LeadInternalNote, userId: number | undefined, isAdmin: boolean): boolean {
  return isAdmin || note.author === userId
}

function NoteRow({ leadId, note }: { leadId: number; note: LeadInternalNote }) {
  const { user } = useAuth()
  const isAdmin = user?.crm_rol === "ADMIN_CRM"
  const editable = canEdit(note, user?.id, isAdmin)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.text)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const updateMutation = useUpdateLeadNote(leadId)
  const deleteMutation = useDeleteLeadNote(leadId)

  function handleSave() {
    const text = draft.trim()
    if (!text) return
    updateMutation.mutate({ noteId: note.id, text }, { onSuccess: () => setEditing(false) })
  }

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    deleteMutation.mutate(note.id, { onSuccess: () => setDeleteOpen(false) })
  }

  // Fase 3.2, diseño aprobado: author null (SET_NULL en el backend) es
  // un usuario borrado, no "sin autor" -- "Autor eliminado" explícito,
  // nunca un espacio vacío.
  const authorLabel = note.author === null ? "Autor eliminado" : note.author_name || "—"

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} autoFocus />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDraft(note.text)
                setEditing(false)
              }}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending || !draft.trim()}>
              {updateMutation.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="whitespace-pre-wrap text-sm text-foreground">{note.text}</p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {authorLabel} · {formatRelativeTime(note.created_at)}
              {note.updated_at !== note.created_at && " (editada)"}
            </p>
            {editable && (
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="Editar nota" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Borrar nota" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Borrar esta nota</AlertDialogTitle>
            <AlertDialogDescription>Esta acción es permanente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Borrando…" : "Borrar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Fase 3.2, diseño aprobado: franja propia entre la cabecera y los
// mensajes, visualmente distinta de los globos de chat (fondo muted, sin
// forma de burbuja) para que nadie confunda una nota con algo que el
// contacto vio -- nunca se envían, nunca pasan por Twilio.
//
// Auto-expandida cuando el lead YA tiene notas (saltan a la vista al
// entrar al hilo, pedido explícito del equipo); si no hay ninguna, solo
// un botón chico para agregar la primera, sin franja vacía permanente.
export function LeadNotesPanel({ leadId }: { leadId: number }) {
  const { data: notes, isLoading } = useLeadNotes(leadId)
  const createMutation = useCreateLeadNote(leadId)
  const [expanded, setExpanded] = useState<boolean | null>(null)
  const [draft, setDraft] = useState("")

  if (isLoading || !notes) return null

  const hasNotes = notes.length > 0
  const isExpanded = expanded ?? hasNotes

  function handleCreate() {
    const text = draft.trim()
    if (!text) return
    createMutation.mutate(text, {
      onSuccess: () => {
        setDraft("")
        setExpanded(true)
      },
    })
  }

  if (!hasNotes && !isExpanded) {
    return (
      <div className="shrink-0 border-b border-border px-3 py-1.5">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setExpanded(true)}>
          <StickyNote className="h-3.5 w-3.5" />
          Agregar nota interna
        </Button>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-b border-border bg-muted/40">
      <button
        type="button"
        onClick={() => setExpanded(!isExpanded)}
        className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left"
      >
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <StickyNote className="h-3.5 w-3.5" />
          Notas internas{hasNotes ? ` (${notes.length})` : ""}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          {/* Discreto pero permanente (pedido explícito): siempre visible
              mientras la franja está expandida, sin competir con el
              contenido -- texto chico, sin fondo de alerta. */}
          <p className="text-[11px] text-muted-foreground">Todo el equipo del CRM puede ver estas notas.</p>

          {notes.map((note) => (
            <NoteRow key={note.id} leadId={leadId} note={note} />
          ))}

          <div className="flex flex-col gap-1.5">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribí una nota interna…"
              rows={2}
            />
            <Button size="sm" className="self-end" onClick={handleCreate} disabled={createMutation.isPending || !draft.trim()}>
              {createMutation.isPending ? "Guardando…" : "Agregar nota"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
