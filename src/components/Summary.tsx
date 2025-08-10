import { useStore } from "@state/useStore"

import { Section } from "@components/Section"

export function Summary() {
  const { summary } = useStore()

  return (
    <Section title="Summary">
      <p>{summary}</p>
    </Section>
  )
}
