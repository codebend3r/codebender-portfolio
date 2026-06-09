import { useStore } from "@state/useStore"

import { Section } from "@components/Section"
import styles from "@components/TechnicalSkills.module.css"

import { skillDescriptions } from "@data/skillDescriptions"

const fallbackDescription =
  "A core technology used across modern frontend engineering."

export function TechnicalSkills({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { technical_skills } = useStore()

  return (
    <Section title="Technical Skills" index={index} eyebrow={eyebrow}>
      <ul className={styles.pillList}>
        {technical_skills.map((s) => {
          const description = skillDescriptions[s] ?? fallbackDescription
          return (
            <li
              key={s}
              className={styles.pill}
              aria-label={`${s}: ${description}`}
            >
              {s}
              <span
                data-skill-tooltip
                role="tooltip"
                className={styles.tooltip}
              >
                {description}
              </span>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
