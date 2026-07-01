import { useState } from "react"

import { RenameModal } from "@edit/RenameModal"
import styles from "@edit/VariationsPanel.module.css"

import { useVariations } from "@state/useVariations"

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
  onGenerate: () => void
  onNew: (name: string) => void
}) {
  const {
    variations,
    activeId,
    selectVariation,
    renameVariation,
    deleteVariation,
  } = useVariations()

  const [modal, setModal] = useState<ModalState | null>(null)

  const onBase = activeId === null

  const confirmModal = (name: string) => {
    if (!modal) return
    if (modal.mode === "new") onNew(name)
    else if (modal.id) renameVariation(modal.id, name)
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
              onClick={() => deleteVariation(v.id)}
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
        <button type="button" onClick={onGenerate}>
          Generate PDF
        </button>
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
