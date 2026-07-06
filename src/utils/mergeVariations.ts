export type MergeResult = {
  merged: Variation[]
  // Local versions that must be upserted to the database.
  toPush: Variation[]
  // Remote ids that must be deleted (locally deleted while synced).
  toDelete: string[]
}

export const isSynced = (v: Variation): boolean =>
  v.syncedAt !== undefined && v.syncedAt >= v.updatedAt

// Last-write-wins merge between the local variation list and the rows
// pulled from the database. Deletions propagate both ways: a local id that
// was synced before but is gone remotely was deleted on another machine,
// and ids in pendingDeletes were deleted here while offline.
export function mergeVariations(
  local: Variation[],
  remote: Variation[],
  pendingDeletes: string[]
): MergeResult {
  const remoteById = new Map(remote.map((r) => [r.id, r]))
  const localIds = new Set(local.map((v) => v.id))
  const deletes = new Set(pendingDeletes)

  const merged: Variation[] = []

  for (const v of local) {
    const r = remoteById.get(v.id)
    if (r) {
      if (r.updatedAt > v.updatedAt) {
        merged.push({ ...r, syncedAt: r.updatedAt })
      } else if (r.updatedAt === v.updatedAt) {
        merged.push({ ...v, syncedAt: r.updatedAt })
      } else {
        merged.push(v)
      }
    } else if (v.syncedAt === undefined) {
      merged.push(v)
    }
    // Synced before but missing remotely: deleted elsewhere, drop it.
  }

  for (const r of remote) {
    if (!localIds.has(r.id) && !deletes.has(r.id)) {
      merged.push({ ...r, syncedAt: r.updatedAt })
    }
  }

  return {
    merged,
    toPush: merged.filter((v) => !isSynced(v)),
    toDelete: pendingDeletes.filter((id) => remoteById.has(id)),
  }
}
