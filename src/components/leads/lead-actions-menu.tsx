import { Archive, ArchiveRestore, CheckCircle2, MoreVertical, RotateCcw, Trash2, XCircle } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteLeadAlert } from "@/components/leads/delete-lead-alert"
import { MarkLostDialog } from "@/components/leads/mark-lost-dialog"
import { useArchiveLead, useMarkLeadResolved, useReopenLead } from "@/hooks/use-lead-actions"
import { useAuth } from "@/lib/auth-context"
import type { LeadStage } from "@/lib/types"

interface LeadActionsMenuProps {
  leadId: number
  leadName: string
  stage: LeadStage
  // No es un campo del lead disponible en todos los contextos donde se
  // usa este menú (fila de la lista: se sabe por la tab activa; cabecera
  // del hilo: sí viene del lead) — lo recibe como prop, calculado por
  // quien lo renderiza, en vez de asumir de dónde sale.
  isArchived: boolean
  // Fase 2.8: eliminar saca al lead de todos lados — si el menú vive en
  // la cabecera del hilo abierto, hay que salir de ahí después.
  onDeleted?: () => void
}

// Menú de acciones compartido por la fila de la lista y la cabecera del
// hilo (Fase 2.8, Paso 0 aprobado). Archivar/Perdido son acciones
// normales; Eliminar va separada con un divisor y estilo destructivo, y
// solo aparece para ADMIN_CRM — un COMERCIAL ni la ve (el backend igual
// la rechaza con 403 si se la fuerza por API).
export function LeadActionsMenu({ leadId, leadName, stage, isArchived, onDeleted }: LeadActionsMenuProps) {
  const { user } = useAuth()
  const isAdmin = user?.crm_rol === "ADMIN_CRM"
  const archiveMutation = useArchiveLead(leadId)
  const reopenMutation = useReopenLead(leadId)
  const markResolvedMutation = useMarkLeadResolved(leadId)
  const [markLostOpen, setMarkLostOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isLost = stage === "CLOSED"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Más acciones"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={() => archiveMutation.mutate(!isArchived)} disabled={archiveMutation.isPending}>
            {isArchived ? <ArchiveRestore /> : <Archive />}
            {isArchived ? "Desarchivar" : "Archivar"}
          </DropdownMenuItem>
          {/* Fase 3.1, diseño aprobado: caso de uso del "gracias" -- se ve
              en la lista, no hace falta abrir el hilo para despachar el
              punto azul de "esperando respuesta". Sin guard (mismo
              criterio que mark-read): si ya estaba resuelta, es un no-op
              funcional. */}
          <DropdownMenuItem onSelect={() => markResolvedMutation.mutate()} disabled={markResolvedMutation.isPending}>
            <CheckCircle2 />
            Marcar como resuelta
          </DropdownMenuItem>
          {isLost ? (
            <DropdownMenuItem onSelect={() => reopenMutation.mutate()} disabled={reopenMutation.isPending}>
              <RotateCcw />
              Reabrir
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setMarkLostOpen(true)}>
              <XCircle />
              Marcar como perdido
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <MarkLostDialog leadId={leadId} open={markLostOpen} onOpenChange={setMarkLostOpen} />
      <DeleteLeadAlert
        leadId={leadId}
        leadName={leadName}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={onDeleted}
      />
    </>
  )
}
