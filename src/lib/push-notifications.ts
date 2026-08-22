// Fase 2.9. Helpers de Web Push + detección de iOS/PWA instalada. Nada
// de esto toca la red — eso vive en push-api.ts y en el hook.

export type PushSupportStatus =
  | "unsupported" // navegador sin Push API/Service Worker (o iOS sin instalar)
  | "ios-not-installed" // iOS Safari, la PWA no está instalada en la pantalla de inicio
  | "blocked" // Notification.permission === "denied"
  | "not-subscribed" // permiso concedido u "default", sin PushSubscription activa
  | "subscribed" // ya hay una PushSubscription activa en este navegador

// iOS/iPadOS Safari: navigator.userAgentData no está disponible ahí
// todavía, así que esto usa userAgent + un chequeo de "Mac con touch"
// para no confundir un iPad en modo desktop con una Mac real.
export function isIosDevice(): boolean {
  const ua = navigator.userAgent
  const isIphoneOrIpod = /iPhone|iPod/.test(ua)
  const isIpadOs = /iPad/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)
  return isIphoneOrIpod || isIpadOs
}

// standalone (iOS Safari) o display-mode: standalone (todo lo demás) —
// las dos formas de "esto se abrió como PWA instalada, no como pestaña
// normal del navegador".
export function isStandaloneDisplay(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches
}

function browserSupportsPush(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
}

// applicationServerKey espera un Uint8Array, no el string base64url que
// devuelve el backend — conversión estándar, sin librería.
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function getPushSupportStatus(): Promise<PushSupportStatus> {
  if (isIosDevice() && !isStandaloneDisplay()) return "ios-not-installed"
  if (!browserSupportsPush()) return "unsupported"
  if (Notification.permission === "denied") return "blocked"

  const registration = await navigator.serviceWorker.ready.catch(() => null)
  if (!registration) return "not-subscribed"
  const existing = await registration.pushManager.getSubscription().catch(() => null)
  return existing ? "subscribed" : "not-subscribed"
}
