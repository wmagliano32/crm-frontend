import * as React from "react"

import { cn } from "@/lib/utils"

// select nativo (no radix) a propósito: es el único selector de la 2.3 y
// no necesita búsqueda ni opciones ricas — un <select> del navegador es
// accesible por default y evita sumar una dependencia de UI nueva por un
// solo uso.
function SelectNative({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select-native"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export { SelectNative }
