import type { Data } from "../types"
import { Section } from "./Section"

export function Summary({ d }: { d: Data }) {
  return (
    <Section title="Summary">
      <p>{d.summary}</p>
    </Section>
  )
}
