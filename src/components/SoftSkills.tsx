import { Section } from "@components/Section"
import styles from "@components/TechnicalSkills.module.css"

import { useEditing } from "@edit/EditContext"
import { EditableText } from "@edit/EditableText"
import { SortableItem, SortableList } from "@edit/SortableList"
import sortStyles from "@edit/SortableList.module.css"

import { useStore } from "@state/useStore"

export function addSoftSkill() {
  const store = useStore.getState()
  store.setPath(["soft_skills"], [...store.soft_skills, "New soft skill"])
}

export function removeSoftSkill(index: number) {
  const store = useStore.getState()
  store.setPath(
    ["soft_skills"],
    store.soft_skills.filter((_, i) => i !== index)
  )
}

export function SoftSkills({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { soft_skills } = useStore()
  const { editing, markDirty } = useEditing()
  const store = useStore.getState()

  const act = (fn: () => void) => () => {
    fn()
    markDirty()
  }

  return (
    <Section title="Soft Skills" index={index} eyebrow={eyebrow}>
      <SortableList
        count={soft_skills.length}
        onReorder={(from, to) => store.reorder(["soft_skills"], from, to)}
      >
        <ul className={styles.pillList}>
          {soft_skills.map((s, i) => (
            <SortableItem
              key={i}
              index={i}
              label={`soft skill ${i + 1}`}
              className={[styles.pill, editing ? styles.pillEditing : ""]
                .filter(Boolean)
                .join(" ")}
            >
              {(handle) => (
                <>
                  {handle}
                  <EditableText
                    value={s}
                    path={["soft_skills", i]}
                    ariaLabel={`Soft skill ${i + 1}`}
                  />
                  {editing && (
                    <button
                      type="button"
                      className={sortStyles.removeButton}
                      aria-label={`Remove soft skill ${i + 1}`}
                      onClick={act(() => removeSoftSkill(i))}
                    >
                      ✕
                    </button>
                  )}
                </>
              )}
            </SortableItem>
          ))}
          {editing && (
            <li>
              <button
                type="button"
                className={sortStyles.addChip}
                onClick={act(addSoftSkill)}
              >
                + Add soft skill
              </button>
            </li>
          )}
        </ul>
      </SortableList>
    </Section>
  )
}
