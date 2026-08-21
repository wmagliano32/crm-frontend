import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { apiFetch, ApiError, AUTH_EXPIRED_EVENT } from "@/lib/api-client"
import { clearTokens, hasTokens, setTokens } from "@/lib/token-storage"
import type { CrmMe } from "@/lib/types"

interface AuthContextValue {
  user: CrmMe | null
  status: "loading" | "authenticated" | "unauthenticated"
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CrmMe | null>(null)
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading")

  const loadMe = useCallback(async () => {
    try {
      const me = await apiFetch<CrmMe>("/crm/auth/me/")
      setUser(me)
      setStatus("authenticated")
    } catch {
      setUser(null)
      setStatus("unauthenticated")
    }
  }, [])

  useEffect(() => {
    if (hasTokens()) {
      void loadMe()
    } else {
      setStatus("unauthenticated")
    }
  }, [loadMe])

  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      setStatus("unauthenticated")
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    try {
      const data = await apiFetch<{ access: string; refresh: string }>("/crm/auth/login/", {
        method: "POST",
        auth: false,
        body: { username, password },
      })
      setTokens(data.access, data.refresh)
      await loadMe()
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(
          (err.data && typeof err.data === "object" && "detail" in err.data
            ? String((err.data as { detail: unknown }).detail)
            : null) ?? "No se pudo iniciar sesión."
        )
      }
      throw err
    }
  }, [loadMe])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    setStatus("unauthenticated")
  }, [])

  return <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>")
  return ctx
}
