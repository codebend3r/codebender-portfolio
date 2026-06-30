import { Section } from "@components/Section"

import { EditableText } from "@edit/EditableText"

import { useStore } from "@state/useStore"

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
        {awards.map((a, i) => (
          <li key={i}>
            <strong>
              <EditableText
                value={a.name}
                path={["awards", i, "name"]}
                ariaLabel={`Award ${i + 1} name`}
              />
            </strong>{" "}
            —{" "}
            <EditableText
              value={a.organization}
              path={["awards", i, "organization"]}
              ariaLabel={`Award ${i + 1} organization`}
            />{" "}
            ({a.year})
          </li>
        ))}
      </ul>
    </Section>
  )
}
