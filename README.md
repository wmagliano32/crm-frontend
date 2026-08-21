# WAM CRM — Frontend

Frontend del CRM interno de WAM (Fase 2.0: scaffolding). Proyecto separado
del front actual (`../front`) — no comparte repo, build ni dependencias.

Se despliega en `https://crm.wamsoluciones.com.ar`, contra la API en
`https://api.wamsoluciones.com.ar`.

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4 + shadcn/ui (estilo `radix-nova`)
- TanStack Query (estado del servidor)
- React Router
- PWA (`vite-plugin-pwa`), instalable desde el arranque

## Alcance de esta fase

Solo scaffolding: login, sesión con JWT (access + refresh, auto-refresh),
ruta protegida, layout base y una pantalla placeholder ("Bandeja") que
muestra el usuario logueado y su rol. La bandeja real (conversaciones,
hilo de mensajes) es la Fase 2.1.

## Correrlo en local

Requiere Node 20+ (probado con Node 24) y el backend de Django corriendo en
`http://localhost:8000` (`.env.development` ya apunta ahí).

```bash
cd crm-frontend
npm install
npm run dev
```

Abre en `http://localhost:5173/`. Necesita un usuario con `UsuarioCRM`
activo ya creado en el backend (vía `/crm/empleados/` con un Admin CRM, o
directo por Django admin/shell) para poder loguearse — este proyecto no
crea usuarios, solo consume la API.

## Variables de entorno

- `.env.development` → `VITE_API_BASE=http://localhost:8000`
- `.env.production` → `VITE_API_BASE=https://api.wamsoluciones.com.ar`

Vite elige el archivo automáticamente según el modo (`dev` usa
`.env.development`, `build` usa `.env.production`). No hay secretos acá —
son URLs públicas, por eso están commiteadas.

## Build de producción

```bash
npm run build
```

Corre el chequeo de tipos (`tsc -b`) y genera el build optimizado —
incluyendo `manifest.webmanifest` y el service worker — en `dist/`.

Para probarlo localmente antes de desplegar:

```bash
npm run preview
```

### Deploy al VPS

El build (`dist/`) es estático — no hay build step en el servidor. Se
genera local y se sube tal cual a `~/mi_proyecto/react/crm/build` en el
VPS (nginx ya configurado para servirlo en `crm.wamsoluciones.com.ar`,
con DNS/SSL/CORS ya verificados contra `api.wamsoluciones.com.ar`).

```bash
scripts/deploy.sh
```

El script (`scripts/deploy.sh`):

1. Corre `npm run build` — si el build falla, el script aborta ahí mismo
   (`set -e`), nunca sube nada roto ni a medio hacer.
2. Sube `dist/` por `rsync` a un directorio temporal
   (`~/mi_proyecto/react/crm/build.new`) — el sitio en producción no se
   toca todavía en este paso.
3. Hace el swap de forma atómica en el servidor: `build` → `build.old`,
   `build.new` → `build`. En ningún momento el sitio queda con un árbol de
   archivos a medio copiar.
4. Borra `build.old` y muestra la URL final.

Antes de la primera vez, completar el usuario/host reales del VPS al
principio del script (`REMOTE_USER`, `REMOTE_HOST`, `REMOTE_PORT` si no es
el 22) — o exportarlos como variables de entorno antes de correrlo, por
ejemplo:

```bash
REMOTE_USER=walter REMOTE_HOST=1.2.3.4 scripts/deploy.sh
```

Requiere acceso SSH por clave al VPS (sin prompt de contraseña) para que
`rsync`/`ssh` corran sin intervención manual.

## Estructura

```
src/
  components/
    ui/            shadcn (button, input, label, card, badge)
    layout/         AppLayout (header + Outlet), ProtectedRoute
  lib/
    api-client.ts   fetch con Authorization, refresh automático de JWT
                     y evento crm:auth-expired si el refresh también falla
    auth-context.tsx  AuthProvider/useAuth (login, logout, /crm/auth/me/)
    token-storage.ts  localStorage de access/refresh
    types.ts        tipos de las respuestas de /crm/auth/*
  pages/
    login-page.tsx
    bandeja-page.tsx  placeholder de la Fase 2.1
  App.tsx           router + QueryClientProvider + AuthProvider
```

## Pendiente para más adelante (fuera de esta fase, no implementado)

- Bandeja real: lista de conversaciones, hilo de mensajes, envío.
- ABM de empleados desde la UI (el backend ya existe: `/crm/empleados/`).
- Manejo de roles distinto por pantalla (hoy todo lo que hay es común a
  cualquier `UsuarioCRM` activo).
