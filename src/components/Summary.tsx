import { Section } from "@components/Section"

import { EditableText } from "@edit/EditableText"

import { useStore } from "@state/useStore"

export function Summary() {
  const { summary } = useStore()

  return (
    <Section title="Summary">
      <p>
        <EditableText
          value={summary}
          path={["summary"]}
          multiline
          ariaLabel="Summary"
        />
      </p>
    </Section>
  )
}
