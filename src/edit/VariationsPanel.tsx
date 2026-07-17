import { type ReactNode, useState } from "react"

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

function ButtonIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      className={styles.buttonIcon}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function SaveIcon() {
  return (
    <ButtonIcon>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </ButtonIcon>
  )
}

function PdfIcon() {
  return (
    <ButtonIcon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </ButtonIcon>
  )
}

function WordIcon() {
  return (
    <ButtonIcon>
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </ButtonIcon>
  )
}

function SyncIcon() {
  return (
    <ButtonIcon>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
    </ButtonIcon>
  )
}

function SignOutIcon() {
  return (
    <ButtonIcon>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </ButtonIcon>
  )
}

function syncLabel({
  syncing,
  unsyncedCount,
}: {
  syncing: boolean
  unsyncedCount: number
}): string {
  if (syncing) return "Syncing…"
  if (unsyncedCount > 0) return `Sync (${unsyncedCount})`
  return "Sync ✓"
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
          <SaveIcon />
          Save{dirty && !onBase ? " •" : ""}
        </button>
        <button type="button" onClick={() => onGenerate("pdf")}>
          <PdfIcon />
          Generate PDF
        </button>
        <button type="button" onClick={() => onGenerate("docx")}>
          <WordIcon />
          Generate Word
        </button>
        {cloudConfigured && signedIn && (
          <button
            type="button"
            onClick={() => void syncNow()}
            disabled={syncing}
          >
            <SyncIcon />
            {syncLabel({ syncing, unsyncedCount })}
          </button>
        )}
        {cloudConfigured && signedIn && (
          <button
            type="button"
            className={styles.signOut}
            onClick={() => void useAuth.getState().signOut()}
          >
            <SignOutIcon />
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
