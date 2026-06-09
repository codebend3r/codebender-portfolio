import { useStore } from "@state/useStore"

import { Section } from "@components/Section"

export function Education({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { education } = useStore()

  return (
    <Section title="Education" index={index} eyebrow={eyebrow}>
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
