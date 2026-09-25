import { useDiff } from "@components/DiffContext"
import hl from "@components/DiffHighlight.module.css"
import { Section } from "@components/Section"
import styles from "@components/Summary.module.css"

import { EditableText } from "@edit/EditableText"

import { useStore } from "@state/useStore"

import { periodBounds } from "@utils/careerMap"
import { partitionExperience } from "@utils/employment"

const earliestYear = (entries: readonly Experience[]): number | null => {
  const starts = entries.flatMap((entry) => {
    const bounds = periodBounds(entry.period)
    return bounds ? [Math.floor(bounds.start)] : []
  })
  return starts.length ? Math.min(...starts) : null
}

export function Summary() {
  const { summary, work_experience } = useStore()
  const diff = useDiff()
  const tracks = partitionExperience(work_experience)
  const employmentSince = earliestYear(tracks.main)
  const sideSince = earliestYear(tracks.side)

  return (
    <Section title="Summary">
      <p
        className={[styles.lede, (diff?.summary ?? false) ? hl.modified : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <EditableText
          value={summary}
          path={["summary"]}
          multiline
          ariaLabel="Summary"
        />
      </p>
      {employmentSince !== null && sideSince !== null && (
        <p className={styles.legend}>
          <span className={styles.key}>
            <span
              className={`${styles.swatch} ${styles.employmentSwatch}`}
              aria-hidden
            />
            Employment · since {employmentSince}
          </span>
          <span className={styles.key}>
            <span
              className={`${styles.swatch} ${styles.sideSwatch}`}
              aria-hidden
            />
            <span>
              <a className={styles.sideLink} href="#codebender">
                Codebender Inc.
              </a>{" "}
              · my side projects, in parallel since {sideSince}
            </span>
          </span>
        </p>
      )}
    </Section>
  )
}
