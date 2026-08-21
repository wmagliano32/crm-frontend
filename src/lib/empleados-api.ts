import { apiFetch } from "@/lib/api-client"
import type { Empleado, PaginatedResponse } from "@/lib/types"

// GET /crm/empleados/ usa la paginación global (PageNumberPagination,
// PAGE_SIZE=50 fijo — este viewset no define page_size_query_param, a
// diferencia de StandardResultsSetPagination). De sobra para un equipo CRM
// real; si algún día se supera, acá hay que sumar paginado de verdad.
export async function fetchEmpleados(): Promise<Empleado[]> {
  const data = await apiFetch<PaginatedResponse<Empleado>>("/crm/empleados/")
  return data.results
}
