import { cn } from "@/lib/utils"

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void
  className?: string
}

// Fase 3.1, diseño aprobado: borde arrastrable entre columnas de la
// bandeja. Solo escritorio (md:block) -- en mobile la navegación sigue
// siendo por pilas, no hay dos columnas que separar.
export function ResizeHandle({ onMouseDown, className }: ResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onMouseDown={onMouseDown}
      className={cn(
        "hidden md:block relative w-1 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/40 active:bg-primary/60",
        className
      )}
    >
      {/* Hitbox más ancho que la línea visible, para no requerir precisión de píxel. */}
      <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
    </div>
  )
}
