import type { Data } from "../types"
import { Section } from "./Section"

export function Awards({ d }: { d: Data }) {
  return (
    <Section title="Awards">
      <ul>
        {d.awards.map((a) => (
          <li key={a.name + a.year}>
            <strong>{a.name}</strong> — {a.organization} ({a.year})
          </li>
        ))}
      </ul>
    </Section>
  )
}
