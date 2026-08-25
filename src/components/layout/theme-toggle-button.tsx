import { Check, Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme, type ThemePreference } from "@/lib/theme-context"

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Según el sistema", icon: Monitor },
]

// Fase 3.1, diseño aprobado: toggle de 3 estados al lado de
// NotificationsButton en la cabecera. El ícono del botón (no del menú)
// refleja la preferencia elegida, no el tema resuelto -- en "sistema" se
// ve el ícono de monitor incluso si ahora mismo está en oscuro, para que
// no parezca que quedó fijo en un modo cuando en realidad sigue al SO.
export function ThemeToggleButton() {
  const { preference, setPreference } = useTheme()
  const CurrentIcon = OPTIONS.find((o) => o.value === preference)?.icon ?? Monitor

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Tema">
          <CurrentIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => setPreference(value)}>
            <Icon />
            {label}
            {preference === value && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
