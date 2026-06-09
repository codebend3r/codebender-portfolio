import { useStore } from "@state/useStore"

import { Section } from "@components/Section"

export function Languages({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { languages } = useStore()

  return (
    <Section title="Languages" index={index} eyebrow={eyebrow}>
      <ul>
        {languages.map((l) => (
          <li key={l.name}>
            <strong>{l.name}:</strong> {l.proficiency}
          </li>
        ))}
      </ul>
    </Section>
  )
}
