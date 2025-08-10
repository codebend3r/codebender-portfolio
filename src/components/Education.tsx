import type { Data } from "../types"
import { Section } from "./Section"

export function Education({ d }: { d: Data }) {
  return (
    <Section title="Education">
      <ul>
        {d.education.map((e) => (
          <li key={e.program + e.institution}>
            <strong>{e.program}</strong> — {e.institution}
            {e.details ? ` — ${e.details}` : ""}
          </li>
        ))}
      </ul>
    </Section>
  )
}
