import { useStore } from "@state/useStore"

import { Section } from "@components/Section"

import styles from "./WorkExperience.module.css"

export function WorkExperience() {
  const { work_experience } = useStore()

  return (
    <Section title="Work Experience">
      <ul className={styles.timeline}>
        {work_experience.map((w) => (
          <li key={w.company + w.period}>
            <div className={styles.item}>
              <div className={styles.header}>
                <div>
                  <h3>{w.role}</h3>
                  <p className={styles.muted}>{w.company}</p>
                </div>
                <span className={styles.period}>{w.period}</span>
              </div>
              <ul className={styles.bullets}>
                {w.achievements.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
