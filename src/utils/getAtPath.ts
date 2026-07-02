export function getAtPath(obj: unknown, path: PathKey[]): unknown {
  return path.reduce<unknown>(
    (acc, key) => (acc as Record<PathKey, unknown> | undefined)?.[key],
    obj
  )
}
