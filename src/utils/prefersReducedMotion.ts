// Whether the visitor's OS/browser prefers reduced motion — used to gate
// non-essential animation and to choose "auto" vs "smooth" scroll behavior.
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
