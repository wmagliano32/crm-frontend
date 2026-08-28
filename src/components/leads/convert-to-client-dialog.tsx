import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useConvertLeadToClient } from "@/hooks/use-lead-actions"
import { searchClientes } from "@/lib/leads-api"
import type { ClienteSugerido } from "@/lib/types"

interface ConvertToClientDialogProps {
  leadId: number
  leadName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  // Fase 3.6: el mismo diálogo sirve para CONVERTIR (desde el menú) y para
  // COMPLETAR el vínculo de un lead que ya es cliente (desde la ficha). El
  // endpoint es el mismo e idempotente sobre es_cliente; sólo cambia el copy,
  // porque "deja de ser un prospecto" ya no aplica cuando ya lo era.
  yaEsCliente?: boolean
}

// Fase 3.6: el matching automático por teléfono (2.13) solo reconoce a quien
// tiene el teléfono cargado — 2 de 44 asociados en producción — así que cada
// empleado de un cliente que escribe entra como prospecto y hay que
// convertirlo a mano.
//
// Vincular el usuario es OPCIONAL a propósito: a veces se sabe que es cliente
// pero todavía no de quién. Marcarlo cliente calla al bot de inmediato, que
// es lo urgente, y el vínculo se completa después reabriendo este diálogo.
//
// Mismo AlertDialog que MarkLostDialog (las únicas primitivas aprobadas son
// DropdownMenu y AlertDialog) y mismo criterio con el botón de confirmar: un
// <Button> normal, para no cerrar el modal si el POST falla.
export function ConvertToClientDialog({
  leadId,
  leadName,
  open,
  onOpenChange,
  yaEsCliente = false,
}: ConvertToClientDialogProps) {
  const [termino, setTermino] = useState("")
  const [sugerencias, setSugerencias] = useState<ClienteSugerido[]>([])
  const [buscando, setBuscando] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState(false)
  const [elegido, setElegido] = useState<ClienteSugerido | null>(null)
  const mutation = useConvertLeadToClient(leadId)
  // El segmento de la bandeja vive en la URL (?segmento=clientes) y se filtra
  // 100% en el frontend por es_cliente: al convertir, el lead desaparece de
  // Prospectos. La navegación lo sigue en vez de dejarlo desaparecer sin
  // explicación — el hilo abierto (ruta /bandeja/:leadId) no se toca.
  const [searchParams, setSearchParams] = useSearchParams()

  // Debounce simple: el buscador dispara por tipeo y el backend ignora
  // términos de menos de 2 caracteres.
  useEffect(() => {
    if (!open) return
    const q = termino.trim()
    // Con menos de 2 caracteres no se busca. No se limpia el state acá (sería
    // un setState sincrónico dentro del efecto): el render decide qué mostrar
    // a partir de terminoValido, y el próximo fetch reemplaza la lista.
    if (q.length < 2) return
    let cancelado = false
    const t = setTimeout(() => {
      searchClientes(q)
        .then((data) => {
          if (cancelado) return
          setSugerencias(data.results)
          setErrorBusqueda(false)
        })
        .catch(() => {
          if (!cancelado) setErrorBusqueda(true)
        })
        .finally(() => {
          if (!cancelado) setBuscando(false)
        })
    }, 300)
    return () => {
      cancelado = true
      clearTimeout(t)
    }
  }, [termino, open])

  function handleOpenChange(next: boolean) {
    if (!next) {
      setTermino("")
      setSugerencias([])
      setElegido(null)
      setErrorBusqueda(false)
      mutation.reset()
    }
    onOpenChange(next)
  }

  // Derivado, no estado: evita tener que sincronizar dos fuentes de verdad.
  const terminoValido = termino.trim().length >= 2
  const sugerenciasVisibles = terminoValido ? sugerencias : []

  function handleConfirm() {
    mutation.mutate(elegido?.id ?? null, {
      onSuccess: () => {
        const params = new URLSearchParams(searchParams)
        params.set("segmento", "clientes")
        setSearchParams(params, { replace: true })
        handleOpenChange(false)
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {yaEsCliente ? "Vincular usuario" : "Convertir en cliente"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {yaEsCliente ? (
              <>Elegí a qué usuario corresponde {leadName}. Ya está marcado como cliente.</>
            ) : (
              <>
                {leadName} deja de ser un prospecto.{" "}
                <strong>El bot deja de tratarlo como tal</strong> y no vuelve a ofrecerle demos ni
                seguimiento comercial.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="buscar-cliente">
              {yaEsCliente ? "Usuario" : "Vincular a un usuario (opcional)"}
            </Label>
            <Input
              id="buscar-cliente"
              value={termino}
              onChange={(e) => {
                const valor = e.target.value
                setTermino(valor)
                setElegido(null)
                // El spinner se enciende desde el evento que causa el cambio,
                // no desde el efecto: así aparece sin esperar el debounce y
                // sin un setState sincrónico dentro de useEffect.
                setBuscando(valor.trim().length >= 2)
              }}
              placeholder="Nombre, email o usuario…"
              autoComplete="off"
            />
          </div>

          {elegido ? (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{elegido.nombre}</span>
                <span className="text-xs text-muted-foreground">
                  {elegido.es_asociado ? `asociado de ${elegido.organizacion}` : elegido.organizacion}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setElegido(null)}>
                Quitar
              </Button>
            </div>
          ) : (
            <>
              {terminoValido && buscando && <p className="text-sm text-muted-foreground">Buscando…</p>}
              {terminoValido && errorBusqueda && (
                <p className="text-sm text-destructive">No se pudo buscar. Probá de nuevo.</p>
              )}
              {terminoValido && !buscando && !errorBusqueda && sugerenciasVisibles.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {yaEsCliente
                    ? "Sin resultados entre los clientes."
                    : "Sin resultados entre los clientes. Podés convertirlo igual y vincularlo después."}
                </p>
              )}
              {sugerenciasVisibles.length > 0 && (
                <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
                  {sugerenciasVisibles.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setElegido(s)}
                        className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left hover:bg-muted"
                      >
                        <span className="text-sm font-medium">{s.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {s.es_asociado ? `asociado de ${s.organizacion}` : s.organizacion}
                          {s.email ? ` · ${s.email}` : ""}
                        </span>
                        {/* Se muestra, no se oculta: una persona puede escribir
                            desde dos números y ambos leads apuntar al mismo User. */}
                        {s.leads_vinculados.length > 0 && (
                          <span className="text-xs text-amber-600">
                            ya vinculado al lead #{s.leads_vinculados.join(", #")}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {mutation.isError && (
            <p className="text-sm text-destructive">No se pudo convertir. Probá de nuevo.</p>
          )}
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={mutation.isPending || (yaEsCliente && !elegido)}
          >
            {mutation.isPending
              ? yaEsCliente
                ? "Vinculando…"
                : "Convirtiendo…"
              : yaEsCliente
                ? "Vincular usuario"
                : elegido
                  ? "Convertir y vincular"
                  : "Convertir sin vincular"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
