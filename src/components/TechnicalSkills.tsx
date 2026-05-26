import { useStore } from "@state/useStore"

import { Section } from "@components/Section"

import { skillDescriptions } from "@data/skillDescriptions"

import styles from "./TechnicalSkills.module.css"

const fallbackDescription =
  "A core technology used across modern frontend engineering."

export function TechnicalSkills() {
  const { technical_skills } = useStore()

  return (
    <Section title="Technical Skills">
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
