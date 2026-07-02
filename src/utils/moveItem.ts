// Returns a copy of `list` with the item at `from` moved to `to`, or null
// when the indices are equal or out of range (no move needed).
export function moveItem<T>(
  list: readonly T[],
  from: number,
  to: number
): T[] | null {
  if (from === to) return null
  if (from < 0 || from >= list.length || to < 0 || to >= list.length)
    return null
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}
