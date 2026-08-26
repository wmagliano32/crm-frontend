import { FileText, Loader2, Paperclip, Send, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useHandoffLead } from "@/hooks/use-lead-actions"
import type { useNow } from "@/hooks/use-now"
import { useTemplates } from "@/hooks/use-templates"
import { validateAttachment } from "@/lib/attachment-limits"
import { formatFileSize } from "@/lib/thread-format"
import type { Lead, SalesTemplate } from "@/lib/types"
import { computeWindowStatus } from "@/lib/window-format"

interface ThreadComposerProps {
  lead: Lead
  now: ReturnType<typeof useNow>
  onSend: (text: string) => void
  onSendAttachment: (text: string, file: File) => void
  onSendTemplate: (templateLabel: string, templateKey: string, templateVars: Record<string, string>) => void
}

export function ThreadComposer({ lead, now, onSend, onSendAttachment, onSendTemplate }: ThreadComposerProps) {
  const [text, setText] = useState("")
  const windowStatus = computeWindowStatus(lead.last_inbound_at, now)

  if (windowStatus.isOpen) {
    // Fase 2.10, Paso 0 (aprobado): mismo gate que
    // _lead_allows_manual_attachment en el backend (sales_ai/views.py) —
    // HANDOFF o cliente ya convertido. No tiene nada que ver con
    // windowStatus (eso es la ventana de 24h de WhatsApp, un gate
    // distinto que ya decide si esta rama se muestra o no).
    const canAttach = lead.stage === "HANDOFF" || lead.es_cliente
    return <OpenComposer text={text} setText={setText} onSend={onSend} onSendAttachment={onSendAttachment} canAttach={canAttach} />
  }
  if (lead.stage === "HANDOFF") {
    return <TemplateComposer lead={lead} windowLabel={windowStatus.label} onSendTemplate={onSendTemplate} />
  }
  return <HandoffPrompt leadId={lead.id} windowLabel={windowStatus.label} />
}

function OpenComposer({
  text,
  setText,
  onSend,
  onSendAttachment,
  canAttach,
}: {
  text: string
  setText: (value: string) => void
  onSend: (text: string) => void
  onSendAttachment: (text: string, file: File) => void
  canAttach: boolean
}) {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Preview de imagen ANTES de subir, con opción de quitarlo (pedido
  // explícito) — object URL local, nunca pega al backend hasta el submit.
  // createObjectURL es sincrónico: se deriva en render (useMemo), el
  // efecto solo libera el URL anterior — no dispara un re-render.
  const previewUrl = useMemo(
    () => (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null),
    [file]
  )
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null
    e.target.value = "" // permite re-elegir el mismo archivo después de sacarlo
    if (!picked) return
    // Validación en el cliente ANTES de subir (pedido explícito): mismos
    // límites por categoría que el backend (Frente 3), el error se ve acá
    // mismo, no después de esperar una subida que iba a fallar.
    const error = validateAttachment(picked)
    if (error) {
      setFileError(error)
      setFile(null)
      return
    }
    setFileError(null)
    setFile(picked)
  }

  function removeFile() {
    setFile(null)
    setFileError(null)
  }

  function submit() {
    if (file) {
      onSendAttachment(text, file)
      setFile(null)
      setText("")
      return
    }
    if (!text.trim()) return
    onSend(text)
    setText("")
  }

  return (
    <div className="flex shrink-0 flex-col gap-1.5 border-t border-border p-2.5">
      {!canAttach && (
        <p className="px-1 text-[11px] text-muted-foreground">
          Los adjuntos solo se pueden mandar en HANDOFF o a clientes ya convertidos.
        </p>
      )}
      {file && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs">
          {previewUrl ? (
            <img src={previewUrl} alt={file.name} className="h-8 w-8 shrink-0 rounded object-cover" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <span className="shrink-0 text-muted-foreground">{formatFileSize(file.size)}</span>
          <button
            type="button"
            onClick={removeFile}
            aria-label="Quitar adjunto"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {fileError && <p className="px-1 text-[11px] text-destructive">{fileError}</p>}
      <div className="flex items-end gap-2">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} disabled={!canAttach} />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Adjuntar archivo"
          title={canAttach ? "Adjuntar archivo" : "Los adjuntos solo se pueden mandar en HANDOFF o a clientes ya convertidos."}
          disabled={!canAttach}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Escribí un mensaje…"
          rows={1}
          className="max-h-32 min-h-8 flex-1 resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button size="icon" onClick={submit} disabled={!text.trim() && !file} aria-label="Enviar">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Ventana cerrada y lead sin HANDOFF: no hay NINGUNA vía de envío (ni
// texto libre ni plantilla — send-template exige stage HANDOFF, ver Paso
// 0). Dejarlo en un campo deshabilitado sin explicación es la razón
// número uno por la que se abandonan estas bandejas (pedido explícito).
function HandoffPrompt({ leadId, windowLabel }: { leadId: number; windowLabel: string }) {
  const handoffMutation = useHandoffLead(leadId)

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-muted/40 p-3 text-sm">
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">{windowLabel}.</span> Para reabrir el contacto, pasá el lead a
        HANDOFF y enviá una plantilla.
      </p>
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() => handoffMutation.mutate()}
        disabled={handoffMutation.isPending}
      >
        {handoffMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Pasar a HANDOFF
      </Button>
      {handoffMutation.isError && <p className="text-xs text-destructive">No se pudo cambiar el stage. Reintentá.</p>}
    </div>
  )
}

function TemplateComposer({
  lead,
  windowLabel,
  onSendTemplate,
}: {
  lead: Lead
  windowLabel: string
  onSendTemplate: ThreadComposerProps["onSendTemplate"]
}) {
  const { data: templates, isLoading, isError } = useTemplates(lead.id)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const selected = templates?.find((t) => t.key === selectedKey) ?? null

  if (selectedKey && selected) {
    return (
      <TemplateVariablesForm
        template={selected}
        onCancel={() => setSelectedKey(null)}
        onConfirm={(vars) => {
          onSendTemplate(selected.label, selected.key, vars)
          setSelectedKey(null)
        }}
      />
    )
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-muted/40 p-3 text-sm">
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">{windowLabel}.</span> Enviá una plantilla aprobada para reabrir
        la conversación.
      </p>
      {isLoading && <p className="text-xs text-muted-foreground">Cargando plantillas…</p>}
      {isError && <p className="text-xs text-destructive">No se pudieron cargar las plantillas.</p>}
      {templates && templates.length === 0 && (
        <p className="text-xs text-muted-foreground">No hay plantillas disponibles.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {templates?.map((template) => (
          <Button key={template.key} size="sm" variant="outline" onClick={() => setSelectedKey(template.key)}>
            {template.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

function TemplateVariablesForm({
  template,
  onCancel,
  onConfirm,
}: {
  template: SalesTemplate
  onCancel: () => void
  onConfirm: (vars: Record<string, string>) => void
}) {
  const [vars, setVars] = useState<Record<string, string>>({})
  const missingRequired = template.variables.some((v) => v.required && !(vars[v.key] || "").trim())

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-muted/40 p-3 text-sm">
      <p className="font-medium">{template.label}</p>
      {template.preview_text && <p className="text-xs text-muted-foreground">{template.preview_text}</p>}
      <div className="flex flex-col gap-1.5">
        {template.variables.map((variable) => (
          <div key={variable.key} className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor={`tpl-var-${variable.key}`}>
              {variable.label}
              {variable.required && " *"}
            </label>
            <Input
              id={`tpl-var-${variable.key}`}
              value={vars[variable.key] ?? ""}
              onChange={(e) => setVars((prev) => ({ ...prev, [variable.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onConfirm(vars)} disabled={missingRequired}>
          Confirmar envío
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
