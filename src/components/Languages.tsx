import { useStore } from "@state/useStore"

import { Section } from "@components/Section"

export function Languages() {
  const { languages } = useStore()

  return (
    <Section title="Languages">
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
