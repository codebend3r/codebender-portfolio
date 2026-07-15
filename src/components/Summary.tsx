import { useDiff } from "@components/DiffContext"
import hl from "@components/DiffHighlight.module.css"
import { Section } from "@components/Section"

import { EditableText } from "@edit/EditableText"

import { useStore } from "@state/useStore"

export function Summary() {
  const { summary } = useStore()
  const diff = useDiff()

  return (
    <Section title="Summary">
      <p className={(diff?.summary ?? false) ? hl.modified : undefined}>
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
