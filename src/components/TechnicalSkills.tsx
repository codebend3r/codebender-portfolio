import type { FocusEvent, MouseEvent } from "react"

import { Section } from "@components/Section"
import styles from "@components/TechnicalSkills.module.css"

import { useEditing } from "@edit/EditContext"
import { EditableText } from "@edit/EditableText"
import { SortableItem, SortableList } from "@edit/SortableList"
import sortStyles from "@edit/SortableList.module.css"

import { useStore } from "@state/useStore"

// Skills and their hover texts are parallel arrays; reorder both so each
// pill keeps its description, padding first in case they drifted apart.
export function reorderSkills(from: number, to: number) {
  const store = useStore.getState()
  const missing =
    store.technical_skills.length - store.skill_descriptions.length
  if (missing > 0) {
    store.setPath(
      ["skill_descriptions"],
      [...store.skill_descriptions, ...Array<string>(missing).fill("")]
    )
  }
  store.reorder(["technical_skills"], from, to)
  store.reorder(["skill_descriptions"], from, to)
}

export function addSkill() {
  const store = useStore.getState()
  store.setPath(["technical_skills"], [...store.technical_skills, "New skill"])
  store.setPath(["skill_descriptions"], [...store.skill_descriptions, ""])
}

export function removeSkill(index: number) {
  const store = useStore.getState()
  store.setPath(
    ["technical_skills"],
    store.technical_skills.filter((_, i) => i !== index)
  )
  store.setPath(
    ["skill_descriptions"],
    store.skill_descriptions.filter((_, i) => i !== index)
  )
}

const fallbackDescription =
  "A core technology used across modern frontend engineering."

function clampTooltipToViewport(pill: HTMLElement) {
  const tooltip = pill.querySelector<HTMLElement>("[data-skill-tooltip]")
  if (!tooltip) return

  pill.style.setProperty("--tooltip-shift", "0px")
  const rect = tooltip.getBoundingClientRect()

  const margin = 8
  const overflowLeft = margin - rect.left
  const overflowRight = rect.right - (window.innerWidth - margin)

  let shift = 0
  if (overflowLeft > 0) shift = overflowLeft
  else if (overflowRight > 0) shift = -overflowRight

  if (shift !== 0) pill.style.setProperty("--tooltip-shift", `${shift}px`)
}

export function TechnicalSkills({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { technical_skills, skill_descriptions } = useStore()
  const { editing, markDirty } = useEditing()

  const act = (fn: () => void) => () => {
    fn()
    markDirty()
  }

  return (
    <Section title="Technical Skills" index={index} eyebrow={eyebrow}>
      <SortableList count={technical_skills.length} onReorder={reorderSkills}>
        <ul className={styles.pillList}>
          {technical_skills.map((s, i) => {
            const description = skill_descriptions[i] || fallbackDescription
            return (
              <SortableItem
                key={i}
                index={i}
                label={`skill ${i + 1}`}
                className={
                  editing ? `${styles.pill} ${styles.pillEditing}` : styles.pill
                }
                wrapperProps={{
                  "aria-label": `${s}: ${description}`,
                  onMouseEnter: (e: MouseEvent<HTMLElement>) =>
                    clampTooltipToViewport(e.currentTarget),
                  onFocus: (e: FocusEvent<HTMLElement>) =>
                    clampTooltipToViewport(e.currentTarget),
                }}
              >
                {(handle) => (
                  <>
                    {handle}
                    <EditableText
                      value={s}
                      path={["technical_skills", i]}
                      ariaLabel={`Skill ${i + 1}`}
                    />
                    {editing && (
                      <button
                        type="button"
                        className={sortStyles.removeButton}
                        aria-label={`Remove skill ${i + 1}`}
                        onClick={act(() => removeSkill(i))}
                      >
                        ✕
                      </button>
                    )}
                    <span
                      data-skill-tooltip
                      role="tooltip"
                      className={styles.tooltip}
                    >
                      {description}
                    </span>
                  </>
                )}
              </SortableItem>
            )
          })}
          {editing && (
            <li>
              <button
                type="button"
                className={sortStyles.addChip}
                onClick={act(addSkill)}
              >
                + Add skill
              </button>
            </li>
          )}
        </ul>
      </SortableList>

      {editing && (
        <div className={styles.hoverEditor}>
          <h3 className={styles.hoverEditorTitle}>Chip hover text</h3>
          <ul className={styles.hoverEditorList}>
            {technical_skills.map((s, i) => (
              <li key={i} className={styles.hoverEditorRow}>
                <span className={styles.hoverEditorName}>{s}</span>
                <EditableText
                  multiline
                  value={skill_descriptions[i] ?? ""}
                  path={["skill_descriptions", i]}
                  ariaLabel={`Hover text for ${s}`}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  )
}
