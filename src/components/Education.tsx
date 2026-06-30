import { Section } from "@components/Section"

import { EditableText } from "@edit/EditableText"

import { useStore } from "@state/useStore"

export function Education({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { education } = useStore()

  return (
    <Section title="Education" index={index} eyebrow={eyebrow}>
      <ul>
        {education.map((e, i) => (
          <li key={i}>
            <strong>
              <EditableText
                value={e.program}
                path={["education", i, "program"]}
                ariaLabel={`Education ${i + 1} program`}
              />
            </strong>{" "}
            —{" "}
            <EditableText
              value={e.institution}
              path={["education", i, "institution"]}
              ariaLabel={`Education ${i + 1} institution`}
            />
            {e.details ? ` — ${e.details}` : ""}
          </li>
        ))}
      </ul>
    </Section>
  )
}
