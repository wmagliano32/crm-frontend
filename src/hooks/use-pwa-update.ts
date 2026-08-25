import { useRegisterSW } from "virtual:pwa-register/react"

// Fase 3.5, diseño aprobado: reemplaza el registerSW.js plano que
// inyectaba vite-plugin-pwa (sin lógica reactiva) por el registro manual
// vía virtual:pwa-register/react -- necesario para poder mostrar un
// aviso cuando hay una versión nueva, en vez de que el usuario se quede
// con el JS viejo cargado en memoria hasta que cierre la pestaña por su
// cuenta (autoUpdate + skipWaiting/clientsClaim en sw.ts activan el SW
// nuevo en segundo plano, pero eso no fuerza a recargar).
//
// Chequeo periódico (una hora): registration.update() no cuesta nada si
// no hay nada nuevo, y es la única forma de detectar una versión nueva
// sin depender de que el usuario navegue/recargue por su cuenta.
const PERIODIC_CHECK_MS = 60 * 60 * 1000

export function usePwaUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return
      setInterval(async () => {
        // Mismo criterio que la receta oficial de vite-plugin-pwa: si el
        // navegador está offline, un registration.update() de todos
        // modos no va a encontrar nada nuevo -- evita un ciclo de
        // reintentos inútil.
        if (registration.installing || !navigator.onLine) return
        const resp = await fetch(swUrl, {
          cache: "no-store",
          headers: { cache: "no-store" },
        })
        if (resp.status === 200) await registration.update()
      }, PERIODIC_CHECK_MS)
    },
  })

  // Fase 3.5, diseño aprobado: NO se expone una forma de apagar
  // needRefresh -- el aviso se puede minimizar (estado propio del
  // componente que lo muestra), pero no descartar de forma permanente.
  // El objetivo es que nadie se quede con una versión vieja por días.
  return { needRefresh, updateServiceWorker }
}
