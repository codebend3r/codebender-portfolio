import { useState } from "react"

import { RenameModal } from "@edit/RenameModal"
import styles from "@edit/VariationsPanel.module.css"

import { cloudConfigured } from "@state/supabase"
import { useAuth } from "@state/useAuth"
import { useSync } from "@state/useSync"
import { useVariations } from "@state/useVariations"

import type { DocumentFormat } from "@utils/documentFileName"
import { isSynced } from "@utils/mergeVariations"

type ModalState = {
  mode: "new" | "rename"
  id?: string
  initialName: string
}

export function VariationsPanel({
  dirty,
  onSave,
  onGenerate,
  onNew,
}: {
  dirty: boolean
  onSave: () => void
  onGenerate: (format: DocumentFormat) => void
  onNew: (name: string) => void
}) {
  const {
    variations,
    activeId,
    pendingDeletes,
    selectVariation,
    renameVariation,
    deleteVariation,
  } = useVariations()
  const { session } = useAuth()
  const { syncing, error: syncError, syncNow } = useSync()

  const [modal, setModal] = useState<ModalState | null>(null)

  const onBase = activeId === null
  const signedIn = session !== null
  const unsyncedCount =
    variations.filter((v) => !isSynced(v)).length + pendingDeletes.length

  const confirmModal = (name: string) => {
    if (!modal) return
    if (modal.mode === "new") onNew(name)
    else if (modal.id) renameVariation(modal.id, name)
  }

  const onDelete = (id: string) => {
    deleteVariation(id)
    void syncNow()
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.heading}>
        <span>Variations</span>
        <button
          type="button"
          className={styles.new}
          onClick={() =>
            setModal({
              mode: "new",
              initialName: `Variation ${variations.length + 1}`,
            })
          }
        >
          ＋ New
        </button>
      </div>

      <ul className={styles.list}>
        <li>
          <button
            type="button"
            className={styles.entry}
            aria-current={onBase}
            onClick={() => selectVariation(null)}
          >
            Base (original)
          </button>
        </li>
        {variations.map((v) => (
          <li key={v.id} className={styles.row}>
            <button
              type="button"
              className={styles.entry}
              aria-current={activeId === v.id}
              onClick={() => selectVariation(v.id)}
            >
              {v.name}
            </button>
            {cloudConfigured && (
              <span
                className={isSynced(v) ? styles.synced : styles.unsynced}
                title={isSynced(v) ? "Synced to cloud" : "Not synced to cloud"}
                role="status"
                aria-label={`${v.name}: ${isSynced(v) ? "synced" : "not synced"}`}
              >
                {isSynced(v) ? "✓" : "●"}
              </span>
            )}
            <button
              type="button"
              aria-label={`Rename ${v.name}`}
              onClick={() =>
                setModal({ mode: "rename", id: v.id, initialName: v.name })
              }
            >
              ✎
            </button>
            <button
              type="button"
              aria-label={`Delete ${v.name}`}
              onClick={() => onDelete(v.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <button type="button" onClick={onSave} disabled={onBase || !dirty}>
          Save{dirty && !onBase ? " •" : ""}
        </button>
        <button type="button" onClick={() => onGenerate("pdf")}>
          Generate PDF
        </button>
        <button type="button" onClick={() => onGenerate("docx")}>
          Generate Word
        </button>
        {cloudConfigured && signedIn && (
          <button
            type="button"
            onClick={() => void syncNow()}
            disabled={syncing}
          >
            {syncing
              ? "Syncing…"
              : unsyncedCount > 0
                ? `Sync (${unsyncedCount})`
                : "Sync ✓"}
          </button>
        )}
        {cloudConfigured && signedIn && (
          <button
            type="button"
            className={styles.signOut}
            onClick={() => void useAuth.getState().signOut()}
          >
            Sign out
          </button>
        )}
        {syncError && (
          <p className={styles.syncError} role="alert">
            {syncError}
          </p>
        )}
      </div>

      <RenameModal
        key={modal ? `${modal.mode}:${modal.id ?? "new"}` : "closed"}
        open={modal !== null}
        title={
          modal?.mode === "rename" ? "Rename variation" : "Name this variation"
        }
        initialName={modal?.initialName ?? ""}
        confirmLabel={modal?.mode === "rename" ? "Save" : "Create"}
        onConfirm={confirmModal}
        onClose={() => setModal(null)}
      />
    </aside>
  )
}
