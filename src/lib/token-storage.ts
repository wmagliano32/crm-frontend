// Guarda los tokens JWT del CRM en localStorage. Namespaced (crm_*) para no
// pisar nada de otro proyecto si alguna vez comparten dominio en algún ambiente.

const ACCESS_KEY = "crm_access_token"
const REFRESH_KEY = "crm_refresh_token"

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function setAccessToken(access: string): void {
  localStorage.setItem(ACCESS_KEY, access)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function hasTokens(): boolean {
  return Boolean(getAccessToken() && getRefreshToken())
}
