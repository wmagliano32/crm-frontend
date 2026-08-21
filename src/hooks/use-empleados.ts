import { useQuery } from "@tanstack/react-query"
import { fetchEmpleados } from "@/lib/empleados-api"

export function useEmpleados() {
  return useQuery({
    queryKey: ["empleados"],
    queryFn: fetchEmpleados,
    staleTime: 60_000,
  })
}
