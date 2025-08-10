import { useStore } from "@state/useStore"

import { Section } from "@components/Section"

export function TechnicalSkills() {
  const { technical_skills } = useStore()

  return (
    <Section title="Technical Skills">
      <ul className="pill-list">
        {technical_skills.map((s) => (
          <li key={s} className="pill">
            {s}
          </li>
        ))}
      </ul>
    </Section>
  )
}
