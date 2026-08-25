import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Fase 2.9: injectManifest en vez de generateSW (default) — hace
      // falta un service worker propio (src/sw.ts) para poder agregar
      // los handlers de push/notificationclick. El precaching + fallback
      // SPA que antes armaba solo el bloque `workbox: {...}` de abajo
      // ahora están escritos a mano en src/sw.ts (mismos globPatterns/
      // denylist, ver el archivo).
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
      },
      // Fase 3.5, diseño aprobado: "autoUpdate" activaba el SW nuevo en
      // segundo plano apenas terminaba de instalar (sw.ts tenía
      // self.skipWaiting() sin condición) -- el registerSW.js plano que
      // esto inyectaba por default no tenía ninguna lógica reactiva
      // arriba, así que una pestaña abierta desde antes del deploy se
      // quedaba con el JS viejo en memoria por días, sin ningún aviso.
      // "prompt" es el modo que vite-plugin-pwa espera para poder
      // mostrar un botón "Actualizar": el SW nuevo se queda "esperando"
      // (sw.ts ya no hace skipWaiting solo) hasta que el cliente lo pide
      // explícitamente -- ver src/hooks/use-pwa-update.ts (needRefresh/
      // updateServiceWorker vía virtual:pwa-register/react). OJO: con
      // "autoUpdate", needRefresh/onNeedRefresh NUNCA se disparan (es
      // "prompt" el único modo que los expone) -- no alcanza con
      // agregar el hook, hay que cambiar este modo también.
      registerType: "prompt",
      // injectRegister:false porque el registro pasa a ser manual, vía
      // el hook de arriba, no el registerSW.js auto-inyectado (que no
      // tiene forma de exponer needRefresh a React).
      injectRegister: false,
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "WAM CRM",
        short_name: "WAM CRM",
        description: "CRM interno de WAM Soluciones",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": `${import.meta.dirname}/src`,
    },
  },
})
