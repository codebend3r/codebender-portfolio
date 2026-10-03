const pinnedAncestor = (node: Element | null): Element | null => {
  if (!node) return null
  const { position } = getComputedStyle(node)
  if (position === "fixed" || position === "sticky") return node
  return pinnedAncestor(node.parentElement)
}

// Whether a viewport point is off-screen or under a pinned (fixed or
// sticky) layer such as the app header, which content inside a section's
// stacking context can never paint over. A pinned layer that contains
// `within` is that content's own ancestor, so it doesn't count. Layers with
// `pointer-events: none` (the decorative sky) don't hit-test, so they never
// count either.
export function isObscured({
  x,
  y,
  within,
}: {
  x: number
  y: number
  within: Element
}): boolean {
  if (y < 0 || y > window.innerHeight) return true
  const hit = document.elementFromPoint(x, y)
  if (!hit) return true
  const layer = pinnedAncestor(hit)
  return !!layer && !layer.contains(within)
}
