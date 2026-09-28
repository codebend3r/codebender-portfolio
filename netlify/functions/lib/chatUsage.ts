// Daily spend guard for /api/chat, backed by the `chat-usage` Netlify Blobs
// store. Two counters per day: one per visitor (hashed IP) and one site-wide.
//
// NOTE: Netlify Blobs has no atomic increment. checkAndCountUsage does a
// read-then-write, so concurrent requests for the same key can race and the
// count can slightly overshoot a cap. That is acceptable for a spend guard
// (the caps are a ceiling, not an exact quota) and is not a bug to fix here.

const VISITOR_DAILY_CAP = 30
const GLOBAL_DAILY_CAP = 500

// Minimal shape checkAndCountUsage needs from a Netlify Blobs `Store`. Method
// syntax (not arrow-typed properties) so a real `getStore(...)` result
// satisfies this structurally without a cast, and tests can inject an
// in-memory fake.
export type ChatUsageStore = {
  get(key: string, options: { type: "json" }): Promise<unknown>
  setJSON(key: string, data: unknown): Promise<unknown>
}

type UsageCount = { count: number }

export function isUsageCount(value: unknown): value is UsageCount {
  return (
    typeof value === "object" &&
    value !== null &&
    "count" in value &&
    typeof value.count === "number"
  )
}

async function readCount(store: ChatUsageStore, key: string): Promise<number> {
  const raw = await store.get(key, { type: "json" })
  return isUsageCount(raw) ? raw.count : 0
}

export type CheckAndCountUsageResult =
  | { allowed: true }
  | { allowed: false; reason: "visitor" | "global" }

export async function checkAndCountUsage({
  store,
  visitorKey,
  day,
}: {
  store: ChatUsageStore
  visitorKey: string
  day: string
}): Promise<CheckAndCountUsageResult> {
  const visitorCountKey = `${day}/${visitorKey}`
  const globalCountKey = `${day}/global`

  const [visitorCount, globalCount] = await Promise.all([
    readCount(store, visitorCountKey),
    readCount(store, globalCountKey),
  ])

  if (visitorCount >= VISITOR_DAILY_CAP)
    return { allowed: false, reason: "visitor" }
  if (globalCount >= GLOBAL_DAILY_CAP)
    return { allowed: false, reason: "global" }

  await Promise.all([
    store.setJSON(visitorCountKey, {
      count: visitorCount + 1,
    } satisfies UsageCount),
    store.setJSON(globalCountKey, {
      count: globalCount + 1,
    } satisfies UsageCount),
  ])

  return { allowed: true }
}
