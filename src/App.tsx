import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { PwaUpdateBanner } from "@/components/layout/pwa-update-banner"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/lib/theme-context"
import { BandejaPage } from "@/pages/bandeja-page"
import { DemosPage } from "@/pages/demos-page"
import { LoginPage } from "@/pages/login-page"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
  },
})

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<BandejaPage />} />
                  <Route path="/bandeja/:leadId" element={<BandejaPage />} />
                  <Route path="/bandeja/:leadId/ficha" element={<BandejaPage />} />
                  <Route path="/demos" element={<DemosPage />} />
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        {/* Fase 3.5, diseño aprobado: fuera del árbol de rutas a propósito
            -- tiene que verse en cualquier pantalla, login incluido, no
            solo dentro de AppLayout. */}
        <PwaUpdateBanner />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
