// Pure helpers for the RevenueCat webhook, shared with the Node unit tests.
export const PLUS_ENTITLEMENT = "yonder_plus";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type WebhookEvent = {
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  transferred_from?: string[];
  transferred_to?: string[];
};

/** Supabase user ids named by an event. Anonymous RevenueCat ids are ignored. */
export function eventUserIds(event: WebhookEvent) {
  const ids = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? []),
    ...(event.transferred_from ?? []), ...(event.transferred_to ?? [])];
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && uuid.test(id)))];
}

type Subscriber = { entitlements?: Record<string, { expires_date?: string | null }> };

/**
 * The Plus row to store for a subscriber, read from RevenueCat's current state rather than
 * the event so retries and out-of-order deliveries converge. `null` means no Plus.
 */
export function plusRow(subscriber: Subscriber, now = Date.now()) {
  const entitlement = subscriber.entitlements?.[PLUS_ENTITLEMENT];
  if (!entitlement) return null;
  const expires = entitlement.expires_date ?? null;
  if (expires !== null && Date.parse(expires) <= now) return null;
  return { expires_at: expires };
}
