// Reads a query-string override (?sky=, ?theme=, …) and narrows it with the
// caller's type guard, so an unknown or missing value falls back to null.
// One shape shared by every override so they cannot drift apart.
export function overrideFromSearch<T>({
  key,
  guard,
}: {
  key: string
  guard: (value: unknown) => value is T
}): T | null {
  const value = new URLSearchParams(window.location.search).get(key)
  return guard(value) ? value : null
}
