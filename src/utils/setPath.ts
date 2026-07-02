export function setPath<T>(obj: T, path: PathKey[], value: unknown): T {
  if (path.length === 0) return value as T
  const [head, ...rest] = path
  if (Array.isArray(obj)) {
    const clone = [...obj]
    clone[head as number] = setPath(clone[head as number], rest, value)
    return clone as T
  }
  const clone = { ...(obj as Record<string, unknown>) }
  clone[head as string] = setPath(clone[head as string], rest, value)
  return clone as T
}
