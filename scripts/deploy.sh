#!/usr/bin/env bash
# Deploy del CRM frontend a crm.wamsoluciones.com.ar.
#
# Uso:
#   scripts/deploy.sh
#
# Completá REMOTE_USER / REMOTE_HOST / REMOTE_PORT abajo (o exportalos como
# variables de entorno antes de correr el script) con los datos reales del
# VPS antes de la primera vez. Nginx, SSL y CORS ya están configurados del
# lado del servidor — este script solo build + sube + swappea.
set -euo pipefail

# --- Configuración: único lugar con usuario/host/paths, no repetidos ---
REMOTE_USER="${REMOTE_USER:-walter}"
REMOTE_HOST="${REMOTE_HOST:-CAMBIAR_POR_HOST_O_IP_DEL_VPS}"
REMOTE_PORT="${REMOTE_PORT:-22}"
REMOTE_BASE="${REMOTE_BASE:-~/mi_proyecto/react/crm}"
SITE_URL="${SITE_URL:-https://crm.wamsoluciones.com.ar}"

SSH="ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST}"

trap 'echo "Deploy ABORTADO — ver el error arriba. El sitio en producción no se tocó (el swap todavía no corrió, o ya terminó)." >&2' ERR

# --- 1. Build de producción ---
# tsc -b && vite build (npm run build) ya corta con exit code != 0 si algo
# falla, y set -e aborta el script entero acá mismo — nunca se llega a
# subir un build roto o a medio hacer.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "==> Build de producción (npm run build)..."
npm run build

if [ ! -f "dist/index.html" ]; then
  echo "dist/index.html no existe después del build — algo salió mal." >&2
  exit 1
fi

# --- 2. Subir dist/ a un directorio temporal ---
# --delete: build.new queda IDÉNTICO a dist/, sin arrastrar sobras de un
# intento anterior fallido.
echo "==> Subiendo dist/ a ${REMOTE_HOST}:${REMOTE_BASE}/build.new ..."
rsync -avz --delete -e "ssh -p ${REMOTE_PORT}" "dist/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BASE}/build.new/"

# --- 3. Swap atómico + limpieza, todo en una sola conexión remota ---
# mv en el mismo filesystem es atómico a nivel de syscall: en ningún
# momento "build" deja de apuntar a un árbol de archivos completo y
# servible. build.old se borra al final de esta misma corrida, no se
# arrastra entre deploys.
echo "==> Swap atómico en el servidor..."
$SSH bash -s <<REMOTE_SCRIPT
set -euo pipefail
cd ${REMOTE_BASE}
rm -rf build.old
mv build build.old
mv build.new build
rm -rf build.old
REMOTE_SCRIPT

echo "==> Deploy listo: ${SITE_URL}"
