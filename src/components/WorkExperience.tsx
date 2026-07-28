import { Fragment } from "react"

import { useDiff } from "@components/DiffContext"
import hl from "@components/DiffHighlight.module.css"
import { Section } from "@components/Section"
import styles from "@components/WorkExperience.module.css"

import { EditableSelect } from "@edit/EditableSelect"
import { EditableText } from "@edit/EditableText"
import { useEditing } from "@edit/EditContext"
import { SortableItem, SortableList } from "@edit/SortableList"
import sortStyles from "@edit/SortableList.module.css"

import { useStore } from "@state/useStore"

import {
  arrangementOptions,
  employmentParts,
  isEmploymentArrangement,
  isEmploymentSchedule,
  scheduleOptions,
} from "@utils/employment"
import { experienceDuration } from "@utils/experienceDuration"

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
  const diff = useDiff()

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
          {work_experience.map((w, wi) => {
            const duration = experienceDuration(w.period)
            const employment = employmentParts(w)
            return (
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
                        {duration && (
                          <span className={styles.duration}>{duration}</span>
                        )}
                        {editing ? (
                          <span
                            className={`${styles.employment} ${styles.employmentEditor}`}
                          >
                            <EditableSelect
                              value={w.schedule ?? ""}
                              options={scheduleOptions}
                              placeholder="schedule"
                              ariaLabel={`Schedule ${wi + 1}`}
                              onCommit={(next) =>
                                store.setPath(
                                  ["work_experience", wi, "schedule"],
                                  isEmploymentSchedule(next) ? next : undefined
                                )
                              }
                            />
                            <EditableSelect
                              value={w.arrangement ?? ""}
                              options={arrangementOptions}
                              placeholder="arrangement"
                              ariaLabel={`Arrangement ${wi + 1}`}
                              onCommit={(next) =>
                                store.setPath(
                                  ["work_experience", wi, "arrangement"],
                                  isEmploymentArrangement(next)
                                    ? next
                                    : undefined
                                )
                              }
                            />
                          </span>
                        ) : (
                          !!employment.length && (
                            <span className={styles.employment}>
                              {employment.map((part, pi) => (
                                <Fragment key={part.key}>
                                  {pi > 0 && " · "}
                                  <span
                                    style={{
                                      color: `var(--employment-${part.key})`,
                                    }}
                                  >
                                    {part.label}
                                  </span>
                                </Fragment>
                              ))}
                            </span>
                          )
                        )}
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
                      <ul
                        className={
                          editing
                            ? `${styles.bullets} ${styles.bulletCards} ${sortStyles.cardList}`
                            : styles.bullets
                        }
                      >
                        {w.achievements.map((a, ai) => (
                          <SortableItem
                            key={ai}
                            index={ai}
                            label={`achievement ${wi + 1}.${ai + 1}`}
                            className={
                              [
                                editing ? sortStyles.rowCard : "",
                                (diff?.changedAchievements[wi]?.[ai] ?? false)
                                  ? hl.modified
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ") || undefined
                            }
                          >
                            {(achievementHandle) => (
                              <>
                                {achievementHandle}
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
                                  <button
                                    type="button"
                                    className={sortStyles.removeButton}
                                    aria-label={`Remove achievement ${wi + 1}.${ai + 1}`}
                                    onClick={act(() =>
                                      store.removeAchievement(wi, ai)
                                    )}
                                  >
                                    ✕
                                  </button>
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
            )
          })}
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
