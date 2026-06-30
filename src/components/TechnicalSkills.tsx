import { Section } from "@components/Section"
import styles from "@components/TechnicalSkills.module.css"

import { skillDescriptions } from "@data/skillDescriptions"

import { useStore } from "@state/useStore"

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
              onMouseEnter={(e) => clampTooltipToViewport(e.currentTarget)}
              onFocus={(e) => clampTooltipToViewport(e.currentTarget)}
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
