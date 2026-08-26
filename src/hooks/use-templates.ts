import { useQuery } from "@tanstack/react-query"
import { fetchTemplates } from "@/lib/conversations-api"

export function useTemplates(leadId: number) {
  return useQuery({
    queryKey: ["sales-templates", leadId],
    queryFn: () => fetchTemplates(leadId),
    staleTime: 60_000,
  })
}
