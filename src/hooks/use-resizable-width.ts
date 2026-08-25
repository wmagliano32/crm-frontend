import { useCallback, useEffect, useRef, useState } from "react"

// Fase 3.1, diseño aprobado: columnas ajustables en escritorio (lista↔hilo,
// hilo↔ficha). Persistido en localStorage (mismo prefijo crm_ que
// token-storage.ts), con mínimo/máximo para no poder romper el layout.
// No aplica en mobile -- quien lo use ahí simplemente no monta el handle
// (la columna sigue apilada por fuera de este hook).
export function useResizableWidth(storageKey: string, defaultWidth: number, min: number, max: number) {
  const [width, setWidth] = useState<number>(() => {
    const raw = localStorage.getItem(storageKey)
    const parsed = raw ? Number(raw) : NaN
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : defaultWidth
  })
  const draggingRef = useRef<{ startX: number; startWidth: number; direction: 1 | -1 } | null>(null)

  useEffect(() => {
    localStorage.setItem(storageKey, String(width))
  }, [storageKey, width])

  // direction=1: arrastrar a la derecha agranda (handle a la derecha de la
  // columna, ej. lista↔hilo). direction=-1: arrastrar a la derecha achica
  // (handle a la izquierda de la columna, ej. hilo↔ficha).
  const startResize = useCallback(
    (direction: 1 | -1) => (e: React.MouseEvent) => {
      e.preventDefault()
      draggingRef.current = { startX: e.clientX, startWidth: width, direction }

      const onMove = (moveEvent: MouseEvent) => {
        const drag = draggingRef.current
        if (!drag) return
        const delta = (moveEvent.clientX - drag.startX) * drag.direction
        setWidth(Math.min(max, Math.max(min, drag.startWidth + delta)))
      }
      const onUp = () => {
        draggingRef.current = null
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
        document.body.style.removeProperty("cursor")
        document.body.style.removeProperty("user-select")
      }
      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    },
    [width, min, max]
  )

  return { width, startResize }
}
