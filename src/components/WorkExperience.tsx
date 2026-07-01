import { Section } from "@components/Section"
import styles from "@components/WorkExperience.module.css"

import { useEditing } from "@edit/EditContext"
import { EditableText } from "@edit/EditableText"
import { SortableItem, SortableList } from "@edit/SortableList"

import { useStore } from "@state/useStore"

export function WorkExperience({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { work_experience } = useStore()
  const { editing, markDirty } = useEditing()
  const store = useStore.getState()

  const act = (fn: () => void) => () => {
    fn()
    markDirty()
  }

  return (
    <Section title="Work Experience" index={index} eyebrow={eyebrow}>
      <SortableList
        count={work_experience.length}
        onReorder={(from, to) => store.reorder(["work_experience"], from, to)}
      >
        <ul className={styles.timeline}>
          {work_experience.map((w, wi) => (
            <SortableItem key={wi} index={wi} label={`experience ${wi + 1}`}>
              {(experienceHandle) => (
                <div className={styles.item}>
                  <div className={styles.header}>
                    <div>
                      <h3>
                        <EditableText
                          value={w.role}
                          path={["work_experience", wi, "role"]}
                          ariaLabel={`Role ${wi + 1}`}
                        />
                      </h3>
                      <p className={styles.muted}>
                        <EditableText
                          value={w.company}
                          path={["work_experience", wi, "company"]}
                          ariaLabel={`Company ${wi + 1}`}
                        />
                      </p>
                    </div>
                    <span className={styles.period}>
                      <EditableText
                        value={w.period}
                        path={["work_experience", wi, "period"]}
                        ariaLabel={`Period ${wi + 1}`}
                      />
                    </span>
                  </div>

                  {editing && (
                    <div className={styles.rowControls}>
                      {experienceHandle}
                      <button
                        type="button"
                        aria-label={`Remove experience ${wi + 1}`}
                        onClick={act(() => store.removeExperience(wi))}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <SortableList
                    count={w.achievements.length}
                    onReorder={(from, to) =>
                      store.reorder(
                        ["work_experience", wi, "achievements"],
                        from,
                        to
                      )
                    }
                  >
                    <ul className={styles.bullets}>
                      {w.achievements.map((a, ai) => (
                        <SortableItem
                          key={ai}
                          index={ai}
                          label={`achievement ${wi + 1}.${ai + 1}`}
                        >
                          {(achievementHandle) => (
                            <>
                              <EditableText
                                value={a}
                                path={[
                                  "work_experience",
                                  wi,
                                  "achievements",
                                  ai,
                                ]}
                                multiline
                                ariaLabel={`Achievement ${wi + 1}.${ai + 1}`}
                              />
                              {editing && (
                                <span className={styles.rowControls}>
                                  {achievementHandle}
                                  <button
                                    type="button"
                                    aria-label={`Remove achievement ${wi + 1}.${ai + 1}`}
                                    onClick={act(() =>
                                      store.removeAchievement(wi, ai)
                                    )}
                                  >
                                    ✕
                                  </button>
                                </span>
                              )}
                            </>
                          )}
                        </SortableItem>
                      ))}
                    </ul>
                  </SortableList>

                  {editing && (
                    <button
                      type="button"
                      className={styles.addButton}
                      aria-label={`Add achievement to experience ${wi + 1}`}
                      onClick={act(() => store.addAchievement(wi))}
                    >
                      + Add achievement
                    </button>
                  )}
                </div>
              )}
            </SortableItem>
          ))}
        </ul>
      </SortableList>

      {editing && (
        <button
          type="button"
          className={styles.addButton}
          onClick={act(() => store.addExperience())}
        >
          + Add experience
        </button>
      )}
    </Section>
  )
}
