import { useStore } from "@state/useStore"

import { Section } from "@components/Section"

export function Awards({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { awards } = useStore()

  return (
    <Section title="Awards" index={index} eyebrow={eyebrow}>
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
