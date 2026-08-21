import { useQuery } from "@tanstack/react-query"
import { fetchTemplates } from "@/lib/conversations-api"

export function useTemplates() {
  return useQuery({
    queryKey: ["sales-templates"],
    queryFn: fetchTemplates,
    staleTime: 60_000,
  })
}
