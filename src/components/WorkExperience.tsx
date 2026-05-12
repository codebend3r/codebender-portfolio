import { useStore } from "@state/useStore"

import { Section } from "@components/Section"

import { css } from "@styled-system/css"

const timelineStyles = css({
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gap: "16px",
})

const timelineItemStyles = css({
  background: "panel",
  border: "1px solid token(colors.border)",
  borderRadius: "14px",
  padding: "16px",
  "& h3": { margin: 0, fontSize: "18px" },
})

const timelineHeaderStyles = css({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: "12px",
})

const mutedStyles = css({
  color: "muted",
  margin: "2px 0 0",
})

const periodStyles = css({
  color: "accent2",
  fontWeight: 700,
  whiteSpace: "nowrap",
})

const bulletsStyles = css({
  margin: "10px 0 0",
})

export function WorkExperience() {
  const { work_experience } = useStore()

  return (
    <Section title="Work Experience">
      <ul className={timelineStyles}>
        {work_experience.map((w) => (
          <li key={w.company + w.period}>
            <div className={timelineItemStyles}>
              <div className={timelineHeaderStyles}>
                <div>
                  <h3>{w.role}</h3>
                  <p className={mutedStyles}>{w.company}</p>
                </div>
                <span className={periodStyles}>{w.period}</span>
              </div>
              <ul className={bulletsStyles}>
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
