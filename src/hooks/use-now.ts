import { useEffect, useState } from "react"

// Fuerza un re-render periódico para que cosas como el contador de ventana
// de 24h se actualicen solas, sin recargar la página.
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
