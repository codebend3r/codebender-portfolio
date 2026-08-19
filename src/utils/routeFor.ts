export type Route =
  | "generate-proximate"
  | "generate-exact"
  | "edit"
  | "login"
  | "angular-version"
  | "app"

export type RouteMatch = {
  route: Route
  /** Variation id from `/edit-resume/:id`; null on every other path. */
  variationId: string | null
}

const EXACT = new Map<string, Route>([
  ["/edit-resume", "edit"],
  ["/generate-proximate", "generate-proximate"],
  ["/generate-exact", "generate-exact"],
  ["/login", "login"],
  ["/angular-version", "angular-version"],
  ["/angular-version/", "angular-version"],
])

const EDIT_CHILD = /^\/edit-resume\/([^/]+)\/?$/

// A malformed escape (`/edit-resume/%`) throws rather than decoding; the raw
// segment is still a fine id to look up and miss on.
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

// `/edit-resume/:id` stays on the edit page even when the id matches no
// variation, so the editor can say so instead of bouncing to the homepage.
export function routeFor(pathname: string): RouteMatch {
  const exact = EXACT.get(pathname)
  if (exact) return { route: exact, variationId: null }

  const child = EDIT_CHILD.exec(pathname)
  const segment = child?.[1]
  if (segment) return { route: "edit", variationId: decodeSegment(segment) }

  return { route: "app", variationId: null }
}

/** Canonical path for a selection; `null` is the base resume. */
export function editResumePath(variationId: string | null): string {
  if (variationId === null) return "/edit-resume"
  return `/edit-resume/${encodeURIComponent(variationId)}`
}
