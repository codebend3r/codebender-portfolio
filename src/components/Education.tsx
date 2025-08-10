import { useStore } from "@state/useStore"

import { Section } from "@components/Section"

export function Education() {
  const { education } = useStore()

  return (
    <Section title="Education">
      <ul>
        {education.map((e) => (
          <li key={e.program + e.institution}>
            <strong>{e.program}</strong> — {e.institution}
            {e.details ? ` — ${e.details}` : ""}
          </li>
        ))}
      </ul>
    </Section>
  )
}
