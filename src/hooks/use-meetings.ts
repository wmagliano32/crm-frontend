import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cancelMeeting, createMeeting, fetchMeetings, retryMeetingLink, setMeetingLink } from "@/lib/meetings-api"
import type { CreateMeetingPayload } from "@/lib/types"

export function useMeetings(leadId?: number) {
  return useQuery({
    queryKey: ["meetings", leadId ?? "all"],
    queryFn: () => fetchMeetings({ leadId }),
    staleTime: 30_000,
  })
}

function useInvalidateMeetings() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["meetings"] })
}

export function useCreateMeeting() {
  const invalidate = useInvalidateMeetings()
  return useMutation({
    mutationFn: (payload: CreateMeetingPayload) => createMeeting(payload),
    onSuccess: invalidate,
  })
}

export function useCancelMeeting() {
  const invalidate = useInvalidateMeetings()
  return useMutation({
    mutationFn: ({ meetingId, notificar }: { meetingId: number; notificar: boolean }) => cancelMeeting(meetingId, notificar),
    onSuccess: invalidate,
  })
}

export function useRetryMeetingLink() {
  const invalidate = useInvalidateMeetings()
  return useMutation({
    mutationFn: (meetingId: number) => retryMeetingLink(meetingId),
    onSuccess: invalidate,
  })
}

export function useSetMeetingLink() {
  const invalidate = useInvalidateMeetings()
  return useMutation({
    mutationFn: ({ meetingId, meetingUrl }: { meetingId: number; meetingUrl: string }) => setMeetingLink(meetingId, meetingUrl),
    onSuccess: invalidate,
  })
}
