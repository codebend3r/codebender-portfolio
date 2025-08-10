import { useStore } from "@state/useStore"

import { Section } from "@components/Section"

export function Awards() {
  const { awards } = useStore()

  return (
    <Section title="Awards">
      <ul>
        {awards.map((a) => (
          <li key={a.name + a.year}>
            <strong>{a.name}</strong> — {a.organization} ({a.year})
          </li>
        ))}
      </ul>
    </Section>
  )
}
