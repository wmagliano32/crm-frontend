import { clearTokens, getAccessToken, getRefreshToken, setAccessToken, setTokens } from "@/lib/token-storage"

const API_BASE = import.meta.env.VITE_API_BASE

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown, message?: string) {
    super(message ?? `Error ${status} en la petición a la API`)
    this.status = status
    this.data = data
  }
}

// Fase 2.12: los 400 de MeetingViewSet.create/cancel devuelven
// {"notificar": "texto claro"} o {"lead_id": "not found"} en vez de
// {"detail": ...} — apiFetch solo promueve "detail" a err.message, así
// que estos quedan solo en err.data. Helper genérico para mostrar el
// primer mensaje de validación legible, sin acoplarse a un nombre de
// campo puntual (sirve para cualquier ValidationError de DRF, no solo
// meetings).
export function apiErrorMessage(err: unknown, fallback = "Ocurrió un error inesperado."): string {
  if (err instanceof ApiError) {
    if (err.data && typeof err.data === "object") {
      for (const value of Object.values(err.data as Record<string, unknown>)) {
        if (typeof value === "string") return value
        if (Array.isArray(value) && typeof value[0] === "string") return value[0]
      }
    }
    if (err.message) return err.message
  }
  return fallback
}

// Se dispara cuando el refresh token también falló (expiró o es inválido):
// no hay forma de recuperar la sesión, hay que volver a loguearse. La
// escucha AuthProvider (src/lib/auth-context.tsx) para limpiar el estado y
// dejar que las rutas protegidas redirijan solas.
export const AUTH_EXPIRED_EVENT = "crm:auth-expired"

function notifyAuthExpired() {
  clearTokens()
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
}

// Evita disparar varios refresh en paralelo si varias requests pegan 401 al
// mismo tiempo: todas esperan la misma promesa en curso.
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
      .then(async (res) => {
        if (!res.ok) return null
        const data = (await res.json()) as { access?: string; refresh?: string }
        if (!data.access) return null
        // Backend con ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION: cada
        // refresh invalida el token usado y devuelve uno nuevo. Si no lo
        // guardamos, el siguiente refresh pega contra un token blacklisteado
        // y la sesión se corta sin aviso (~4hs de uso). Si algún día el
        // backend cambiara esa config y dejara de mandar "refresh", seguimos
        // andando igual con el access nuevo nada más.
        if (data.refresh) {
          setTokens(data.access, data.refresh)
        } else {
          setAccessToken(data.access)
        }
        return data.access
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  /** No adjuntar Authorization ni intentar refresh (login, etc). */
  auth?: boolean
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = true, body, headers, ...rest } = options

  const doFetch = async (accessOverride?: string | null): Promise<Response> => {
    const finalHeaders = new Headers(headers)
    if (body !== undefined && !finalHeaders.has("Content-Type")) {
      finalHeaders.set("Content-Type", "application/json")
    }
    if (auth) {
      const token = accessOverride ?? getAccessToken()
      if (token) finalHeaders.set("Authorization", `Bearer ${token}`)
    }
    return fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  let response = await doFetch()

  if (auth && response.status === 401) {
    const newAccess = await refreshAccessToken()
    if (!newAccess) {
      notifyAuthExpired()
      throw new ApiError(401, null, "Sesión expirada.")
    }
    response = await doFetch(newAccess)
  }

  if (!response.ok) {
    let data: unknown = null
    try {
      data = await response.json()
    } catch {
      // sin body JSON, no pasa nada
    }
    const message =
      data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : undefined
    throw new ApiError(response.status, data, message)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

// Fase 2.10: envío de adjuntos. fetch no expone progreso de subida (no
// hay onUploadProgress), así que este único caso usa XMLHttpRequest en
// vez de apiFetch — reutiliza el mismo refresh/401 y ApiError de arriba
// para no divergir del resto de la app.
function xhrPost(
  path: string,
  form: FormData,
  accessToken: string | null,
  onProgress?: (fraction: number) => void
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${API_BASE}${path}`)
    if (accessToken) xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`)
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) onProgress(e.loaded / e.total)
    }
    xhr.onload = () => {
      let body: unknown = null
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null
      } catch {
        // sin body JSON, no pasa nada
      }
      resolve({ status: xhr.status, body })
    }
    xhr.onerror = () => reject(new ApiError(0, null, "No se pudo conectar con el servidor."))
    xhr.send(form)
  })
}

export async function apiFetchMultipart<T = unknown>(
  path: string,
  fields: Record<string, string | Blob>,
  onProgress?: (fraction: number) => void
): Promise<T> {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value)
  }

  let { status, body } = await xhrPost(path, form, getAccessToken(), onProgress)

  if (status === 401) {
    const newAccess = await refreshAccessToken()
    if (!newAccess) {
      notifyAuthExpired()
      throw new ApiError(401, null, "Sesión expirada.")
    }
    ;({ status, body } = await xhrPost(path, form, newAccess, onProgress))
  }

  if (status < 200 || status >= 300) {
    const message =
      body && typeof body === "object" && "detail" in body ? String((body as { detail: unknown }).detail) : undefined
    throw new ApiError(status, body, message)
  }

  return body as T
}
