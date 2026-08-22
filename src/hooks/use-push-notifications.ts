import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { subscribeToPush, unsubscribeFromPush } from "@/lib/push-api"
import { getPushSupportStatus, urlBase64ToUint8Array, type PushSupportStatus } from "@/lib/push-notifications"

// Fase 2.9. NO pide permiso al montar — solo calcula el estado actual
// (activate() es la única llamada que dispara el prompt del navegador,
// y siempre en respuesta a un click explícito del botón).
export function usePushNotifications() {
  const { user } = useAuth()
  const [status, setStatus] = useState<PushSupportStatus | "loading">("loading")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    getPushSupportStatus().then(setStatus)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const activate = useCallback(async () => {
    if (!user?.vapid_public_key) {
      setError("No se pudo activar: falta la configuración del servidor.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        await refresh()
        return
      }
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Cast necesario: lib.dom.d.ts tipa Uint8Array como genérico sobre
        // su buffer (ArrayBuffer | SharedArrayBuffer) desde TS 5.7, y
        // PushManager.subscribe pide específicamente <ArrayBuffer>.
        applicationServerKey: urlBase64ToUint8Array(user.vapid_public_key) as BufferSource,
      })
      await subscribeToPush(subscription.toJSON() as PushSubscriptionJSON)
      await refresh()
    } catch {
      setError("No se pudo activar las notificaciones. Probá de nuevo.")
    } finally {
      setBusy(false)
    }
  }, [user, refresh])

  const deactivate = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await unsubscribeFromPush(subscription.endpoint)
        await subscription.unsubscribe()
      }
      await refresh()
    } catch {
      setError("No se pudo desactivar. Probá de nuevo.")
    } finally {
      setBusy(false)
    }
  }, [refresh])

  return { status, busy, error, activate, deactivate }
}
