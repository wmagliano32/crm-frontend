import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type ThemePreference = "light" | "dark" | "system"

const STORAGE_KEY = "crm_theme"

function getSystemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function readStoredPreference(): ThemePreference {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system"
}

function applyResolvedTheme(preference: ThemePreference) {
  const isDark = preference === "dark" || (preference === "system" && getSystemPrefersDark())
  document.documentElement.classList.toggle("dark", isDark)
}

interface ThemeContextValue {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

// Fase 3.1, diseño aprobado: 3 estados (claro/oscuro/sistema), persistido
// en localStorage (crm_theme, mismo prefijo que token-storage.ts). La
// estrategia de clase de Tailwind (@custom-variant dark, index.css:6) ya
// estaba pre-cableada -- esto es lo que le agrega/saca .dark a <html> y
// escucha cambios del SO cuando la preferencia es "sistema".
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readStoredPreference())

  useEffect(() => {
    applyResolvedTheme(preference)
  }, [preference])

  useEffect(() => {
    if (preference !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyResolvedTheme("system")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, next)
    setPreferenceState(next)
  }, [])

  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>")
  return ctx
}
