import { Loader2, Send } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useHandoffLead } from "@/hooks/use-lead-actions"
import type { useNow } from "@/hooks/use-now"
import { useTemplates } from "@/hooks/use-templates"
import type { Lead, SalesTemplate } from "@/lib/types"
import { computeWindowStatus } from "@/lib/window-format"

interface ThreadComposerProps {
  lead: Lead
  now: ReturnType<typeof useNow>
  onSend: (text: string) => void
  onSendTemplate: (templateLabel: string, templateKey: string, templateVars: Record<string, string>) => void
}

export function ThreadComposer({ lead, now, onSend, onSendTemplate }: ThreadComposerProps) {
  const [text, setText] = useState("")
  const windowStatus = computeWindowStatus(lead.last_inbound_at, now)

  if (windowStatus.isOpen) {
    return <OpenComposer text={text} setText={setText} onSend={onSend} />
  }
  if (lead.stage === "HANDOFF") {
    return <TemplateComposer windowLabel={windowStatus.label} onSendTemplate={onSendTemplate} />
  }
  return <HandoffPrompt leadId={lead.id} windowLabel={windowStatus.label} />
}

function OpenComposer({
  text,
  setText,
  onSend,
}: {
  text: string
  setText: (value: string) => void
  onSend: (text: string) => void
}) {
  function submit() {
    if (!text.trim()) return
    onSend(text)
    setText("")
  }

  return (
    <div className="flex shrink-0 items-end gap-2 border-t border-border p-2.5">
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
      <Button size="icon" onClick={submit} disabled={!text.trim()} aria-label="Enviar">
        <Send className="h-4 w-4" />
      </Button>
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
  windowLabel,
  onSendTemplate,
}: {
  windowLabel: string
  onSendTemplate: ThreadComposerProps["onSendTemplate"]
}) {
  const { data: templates, isLoading, isError } = useTemplates()
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
