import { Loader2 } from "lucide-react"
import { useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useCreateLead } from "@/hooks/use-lead-actions"
import { ApiError, apiErrorMessage } from "@/lib/api-client"
import { checkLeadPhone } from "@/lib/leads-api"
import type { ClienteMatch, CreateLeadPayload, LeadExistente } from "@/lib/types"

interface CreateLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Fase 3.7: alta manual de un lead. Hasta ahora un Lead solo existía si
// alguien escribía al WhatsApp — un referido, una llamada o un contacto de
// una reunión no tenían por dónde entrar.
//
// Dialog (no AlertDialog) a propósito: esto es un formulario con varios
// campos, no una confirmación de una acción destructiva — mismo criterio
// que CreateMeetingDialog (Fase 2.12).
//
// Teléfono y nombre son lo único obligatorio. El resto son los campos que
// el bot normalmente califica solo en la conversación: cargarlos a mano es
// opcional porque la mitad de las veces no se saben todavía.
export function CreateLeadDialog({ open, onOpenChange }: CreateLeadDialogProps) {
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [city, setCity] = useState("")
  const [consorciosCount, setConsorciosCount] = useState("")
  const [unitsCount, setUnitsCount] = useState("")
  const [currentSystem, setCurrentSystem] = useState("")
  const [mainPain, setMainPain] = useState("")

  const [clienteMatch, setClienteMatch] = useState<ClienteMatch | null>(null)
  // Solo aplica al caso "match" (candidato único). Arranca TILDADO: si el
  // teléfono ya es de un cliente conocido, lo normal es que sea ese — el
  // checkbox está para poder decir que no, no para tener que decir que sí.
  const [vincular, setVincular] = useState(false)
  const [checkingPhone, setCheckingPhone] = useState(false)

  // El 400 por teléfono duplicado no es "un error del formulario": es un
  // desvío. El lead ya existe, y lo que el operador quiere es abrirlo, no
  // corregir nada. Por eso vive en un estado propio y no en `error`.
  const [leadExistente, setLeadExistente] = useState<LeadExistente | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useCreateLead()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Teléfono ya consultado, para no repetir el GET cuando el campo pierde
  // foco sin haber cambiado (tabular de ida y vuelta por el formulario).
  const checkedPhoneRef = useRef("")
  // Token del chequeo en vuelo: una respuesta que llega tarde, después de
  // que el operador siguió editando el teléfono, NO puede pisar el estado
  // — mandaría el usuario_id de un teléfono que ya no es el del formulario.
  const checkRequestRef = useRef(0)

  function resetClienteMatch() {
    checkedPhoneRef.current = ""
    checkRequestRef.current += 1
    setClienteMatch(null)
    setVincular(false)
    setCheckingPhone(false)
  }

  function handlePhoneChange(value: string) {
    setPhone(value)
    // Cambió el teléfono: todo lo que sabíamos de él deja de valer, tanto
    // el match de cliente como el aviso de duplicado.
    resetClienteMatch()
    setLeadExistente(null)
  }

  async function handlePhoneBlur() {
    const raw = phone.trim()
    if (!raw || raw === checkedPhoneRef.current) return
    checkedPhoneRef.current = raw
    const requestId = ++checkRequestRef.current
    setCheckingPhone(true)
    try {
      const data = await checkLeadPhone(raw)
      if (checkRequestRef.current !== requestId) return
      setClienteMatch(data.cliente_match)
      setVincular(data.cliente_match?.tipo === "match")
    } catch {
      // Consulta informativa: si falla, se sigue pudiendo crear el lead. El
      // backend re-chequea el teléfono por su cuenta en el POST
      // (LeadCreateSerializer.create), así que no perder este GET no deja
      // pasar un cliente sin marcar — solo se pierde el ofrecimiento de
      // vincularlo en el momento.
      if (checkRequestRef.current !== requestId) return
      setClienteMatch(null)
    } finally {
      if (checkRequestRef.current === requestId) setCheckingPhone(false)
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setPhone("")
      setName("")
      setEmail("")
      setCompany("")
      setCity("")
      setConsorciosCount("")
      setUnitsCount("")
      setCurrentSystem("")
      setMainPain("")
      resetClienteMatch()
      setLeadExistente(null)
      setError(null)
      mutation.reset()
    }
    onOpenChange(next)
  }

  // El segmento de la bandeja vive en la URL (?segmento=clientes) y se
  // filtra 100% en el frontend por es_cliente — el mismo mecanismo de la
  // Fase 3.6. Un lead creado como cliente (checkbox tildado, o colisión de
  // teléfono resuelta por el backend) NO se ve en Prospectos: navegar al
  // hilo sin corregir el segmento lo dejaría seleccionado sobre una lista
  // donde no está.
  function goToLead(leadId: number, esCliente: boolean) {
    const params = new URLSearchParams(searchParams)
    if (esCliente) params.set("segmento", "clientes")
    else params.delete("segmento")
    const qs = params.toString()
    navigate(`/bandeja/${leadId}${qs ? `?${qs}` : ""}`)
    handleOpenChange(false)
  }

  // Un <input type="number"> vacío o con basura devuelve "", pero "1e999" sí
  // llega: Number() lo vuelve Infinity y JSON.stringify lo serializa como
  // null, que en un IntegerField(null=True) se guardaría como "sin dato" en
  // vez de rebotar. Se descarta acá.
  function parseCount(raw: string): number | null {
    if (!raw.trim()) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }

  // Los opcionales vacíos se OMITEN, no se mandan como "": los dos
  // contadores son enteros nullable y un "" no pasa la validación de DRF.
  function buildPayload(): CreateLeadPayload {
    const payload: CreateLeadPayload = { phone: phone.trim(), name: name.trim() }
    if (email.trim()) payload.email = email.trim()
    if (company.trim()) payload.company = company.trim()
    if (city.trim()) payload.city = city.trim()
    const consorcios = parseCount(consorciosCount)
    if (consorcios !== null) payload.consorcios_count = consorcios
    const units = parseCount(unitsCount)
    if (units !== null) payload.units_count = units
    if (currentSystem.trim()) payload.current_system = currentSystem.trim()
    if (mainPain.trim()) payload.main_pain = mainPain.trim()
    // Solo con confirmación explícita. Sin usuario_id el backend vuelve a
    // mirar el teléfono y decide solo: colisión → cliente sin vincular +
    // TELEFONO_COMPARTIDO; candidato único → etiqueta REVISAR_CLIENTE.
    if (clienteMatch?.tipo === "match" && vincular) payload.usuario_id = clienteMatch.usuario_id
    return payload
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLeadExistente(null)
    mutation.mutate(buildPayload(), {
      onSuccess: (lead) => goToLead(lead.id, lead.es_cliente),
      onError: (err) => {
        // El lead existente viene TIPADO en el body del 400 (es_cliente es
        // un booleano de verdad) — se puede usar para decidir el segmento
        // sin volver a pedir el lead.
        if (err instanceof ApiError && err.status === 400) {
          const existente = (err.data as { lead_existente?: LeadExistente } | null)?.lead_existente
          if (existente) {
            setLeadExistente(existente)
            return
          }
        }
        setError(apiErrorMessage(err, "No se pudo crear el lead."))
      },
    })
  }

  const puedeGuardar = phone.trim().length > 0 && name.trim().length > 0 && !mutation.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Nuevo lead</DialogTitle>
            <DialogDescription>
              Para cargar a mano un referido, una llamada o un contacto de una reunión — alguien que
              todavía no escribió al WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1">
            <label htmlFor="nl-phone" className="text-xs font-medium text-muted-foreground">
              Teléfono *
            </label>
            <Input
              id="nl-phone"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={handlePhoneBlur}
              placeholder="11 5555-4444"
              autoComplete="off"
              required
            />
            {/* El formato lo resuelve el backend (normalize_phone_to_e164):
                pedirle al operador que escriba E.164 sería trasladarle un
                problema que el sistema ya sabe resolver. */}
            <p className="text-[11px] text-muted-foreground">
              Como lo tengas anotado. Se normaliza solo.
            </p>
          </div>

          {checkingPhone && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Buscando si el teléfono es de un cliente…
            </p>
          )}

          {clienteMatch?.tipo === "match" && (
            <div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/40 px-3 py-2">
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={vincular}
                  onCheckedChange={(checked) => setVincular(checked === true)}
                />
                <span>
                  Este teléfono corresponde a{" "}
                  <strong>{clienteMatch.nombre}</strong>
                  {clienteMatch.organizacion ? <> — {clienteMatch.organizacion}</> : null}. ¿Cargarlo
                  como cliente?
                </span>
              </label>
              {!vincular && (
                // Que quede claro que destildar no es "no pasa nada": el
                // backend igual deja el lead marcado para revisar.
                <p className="pl-6 text-[11px] text-muted-foreground">
                  Sin marcar, entra como prospecto con la etiqueta «¿Es cliente?» para revisarlo
                  después.
                </p>
              )}
            </div>
          )}

          {clienteMatch?.tipo === "colision" && (
            // Sin checkbox: no hay nada que elegir. Varios clientes comparten
            // ese teléfono y adivinar cuál sería peor que no vincular — el
            // backend lo marca cliente sin vínculo, para revisión manual.
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              Este teléfono corresponde a más de un cliente. Se va a cargar como cliente sin
              vincularlo a ninguno, para revisión manual.
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="nl-name" className="text-xs font-medium text-muted-foreground">
              Nombre *
            </label>
            <Input
              id="nl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre y apellido"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="nl-email" className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <Input id="nl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="nl-company" className="text-xs font-medium text-muted-foreground">
                Empresa
              </label>
              <Input id="nl-company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="nl-city" className="text-xs font-medium text-muted-foreground">
                Ciudad
              </label>
              <Input id="nl-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="nl-current-system" className="text-xs font-medium text-muted-foreground">
                Sistema actual
              </label>
              <Input
                id="nl-current-system"
                value={currentSystem}
                onChange={(e) => setCurrentSystem(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="nl-consorcios" className="text-xs font-medium text-muted-foreground">
                Consorcios
              </label>
              <Input
                id="nl-consorcios"
                type="number"
                min={0}
                value={consorciosCount}
                onChange={(e) => setConsorciosCount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="nl-units" className="text-xs font-medium text-muted-foreground">
                Unidades
              </label>
              <Input
                id="nl-units"
                type="number"
                min={0}
                value={unitsCount}
                onChange={(e) => setUnitsCount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="nl-main-pain" className="text-xs font-medium text-muted-foreground">
              Qué le duele hoy
            </label>
            <Input id="nl-main-pain" value={mainPain} onChange={(e) => setMainPain(e.target.value)} />
          </div>

          {leadExistente && (
            <div className="flex flex-col items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              <p>
                Ya hay un lead con este teléfono: <strong>{leadExistente.nombre || leadExistente.phone_e164}</strong>{" "}
                <span className="text-muted-foreground">
                  ({leadExistente.phone_e164}
                  {leadExistente.es_cliente ? " · cliente" : ""})
                </span>
                . No se creó nada.
              </p>
              <Button type="button" size="sm" variant="outline" onClick={() => goToLead(leadExistente.id, leadExistente.es_cliente)}>
                Abrir conversación
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!puedeGuardar}>
              {mutation.isPending ? "Creando…" : "Crear lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
