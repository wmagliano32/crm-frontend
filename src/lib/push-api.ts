import { apiFetch } from "@/lib/api-client"

// Fase 2.9. Shape nativo de PushSubscription.toJSON() del navegador — se
// manda tal cual, sin transformarlo (ver crm.views.WebPushSubscriptionSerializer).
export function subscribeToPush(subscription: PushSubscriptionJSON): Promise<{ ok: boolean; id: number }> {
  return apiFetch("/crm/push-subscriptions/", { method: "POST", body: subscription })
}

export function unsubscribeFromPush(endpoint: string): Promise<{ ok: boolean }> {
  return apiFetch("/crm/push-subscriptions/", { method: "DELETE", body: { endpoint } })
}
