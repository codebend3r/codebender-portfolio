import { useStore } from "@state/useStore"

import { Section } from "@components/Section"

import { css } from "@styled-system/css"

const pillListStyles = css({
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
})

const pillStyles = css({
  background: "panel",
  border: "1px solid token(colors.border)",
  padding: "8px 12px",
  borderRadius: "999px",
  fontWeight: 600,
  fontSize: "14px",
})

export function TechnicalSkills() {
  const { technical_skills } = useStore()

  return (
    <Section title="Technical Skills">
      <ul className={pillListStyles}>
        {technical_skills.map((s) => (
          <li key={s} className={pillStyles}>
            {s}
          </li>
        ))}
      </ul>
    </Section>
  )
}
