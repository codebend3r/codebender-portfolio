import styles from "@edit/VariationsPanel.module.css"

import { useVariations } from "@state/useVariations"

export function VariationsPanel({
  dirty,
  onSave,
  onGenerate,
  onNew,
}: {
  dirty: boolean
  onSave: () => void
  onGenerate: () => void
  onNew: () => void
}) {
  const {
    variations,
    activeId,
    selectVariation,
    renameVariation,
    deleteVariation,
  } = useVariations()

  const onBase = activeId === null

  const rename = (id: string, current: string) => {
    const next = window.prompt("Rename variation", current)?.trim()
    if (next) renameVariation(id, next)
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.heading}>
        <span>Variations</span>
        <button type="button" className={styles.new} onClick={onNew}>
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
              onClick={() => rename(v.id, v.name)}
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
    </aside>
  )
}
