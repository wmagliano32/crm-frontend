/// <reference lib="webworker" />

// Fase 2.9: migrado de generateSW a injectManifest para poder agregar
// los handlers de push/notificationclick a mano — ver vite.config.ts.
// Lo que sigue reemplaza lo que Workbox generaba solo antes: precaching
// + fallback SPA + skipWaiting/clientsClaim. Si el día de mañana cambia
// qué se precachea o la denylist del fallback, hay que tocar ESTE
// archivo también — dejó de ser autogenerado.

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching"
import { NavigationRoute, registerRoute } from "workbox-routing"

self.skipWaiting()
self.addEventListener("activate", () => {
  self.clients.claim()
})

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Fallback SPA: cualquier navegación que no matchee un asset precacheado
// sirve index.html — /api queda afuera para que esas requests vayan
// siempre a red (mismo denylist que tenía workbox.navigateFallbackDenylist).
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html"), { denylist: [/^\/api/] }))

interface PushPayload {
  title: string
  body: string
  url: string
  tag: string
}

// Fase 2.9: el payload lo arma crm/tasks.py send_new_message_push — ver
// crm/push.py del lado del backend para el shape exacto.
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return
  let payload: PushPayload
  try {
    payload = event.data.json() as PushPayload
  } catch {
    return
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      // Mismo tag = mismo lead: una ráfaga de varios mensajes reemplaza
      // la notificación anterior en vez de apilarse (Fase 2.9, Paso 0).
      tag: payload.tag,
      data: { url: payload.url },
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    })
  )
})

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close()
  const targetUrl = (event.notification.data as { url?: string } | undefined)?.url || "/"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const windowClient = client as WindowClient
        if (new URL(windowClient.url).pathname === targetUrl && "focus" in windowClient) {
          return windowClient.focus()
        }
      }
      const existing = clientList[0] as WindowClient | undefined
      if (existing && "navigate" in existing) {
        return existing.navigate(targetUrl).then(() => existing.focus())
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})
