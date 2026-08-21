import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type FieldType = "text" | "number" | "textarea"

interface InlineFieldProps {
  label: string
  value: string | number | null
  type?: FieldType
  disabled?: boolean
  onSave: (value: string | number | null) => void
}

// Editable inline: click para editar, blur/Enter para guardar, Escape para
// cancelar. Vacío se muestra como "Sin datos" en gris, no oculto — Fase
// 2.5: que se vea qué falta preguntar en vez de que el campo desaparezca.
export function InlineField({ label, value, type = "text", disabled, onSave }: InlineFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")

  const stringValue = value === null || value === undefined ? "" : String(value)
  const isEmpty = stringValue === ""

  function startEditing() {
    if (disabled) return
    setDraft(stringValue)
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed === stringValue) return
    if (type === "number") {
      onSave(trimmed === "" ? null : Number(trimmed))
    } else {
      onSave(trimmed)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key === "Enter" && type !== "textarea") {
      e.preventDefault()
      e.currentTarget.blur()
    }
    if (e.key === "Escape") {
      e.preventDefault()
      // Revertir el draft al valor original: el blur que sigue dispara
      // commit() igual, pero como draft === stringValue no hace nada — no
      // hace falta un flag aparte para "cancelado".
      setDraft(stringValue)
      e.currentTarget.blur()
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        disabled={disabled}
        className="flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-60"
      >
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className={cn("text-sm", isEmpty && "text-muted-foreground/60 italic")}>
          {isEmpty ? "Sin datos" : stringValue}
        </span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-0.5 px-2 py-1.5">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {type === "textarea" ? (
        <Textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={handleKeyDown} />
      ) : (
        <Input
          autoFocus
          type={type === "number" ? "number" : "text"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      )}
    </div>
  )
}
