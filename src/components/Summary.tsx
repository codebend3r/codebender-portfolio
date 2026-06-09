import { Section } from "@components/Section"

import { useStore } from "@state/useStore"

export function Summary() {
  const { summary } = useStore()

  return (
    <Section title="Summary">
      <p>{summary}</p>
    </Section>
  )
}
