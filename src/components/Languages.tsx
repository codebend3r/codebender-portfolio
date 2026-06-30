import { Section } from "@components/Section"

import { EditableText } from "@edit/EditableText"

import { useStore } from "@state/useStore"

export function Languages({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { languages } = useStore()

  return (
    <Section title="Languages" index={index} eyebrow={eyebrow}>
      <ul>
        {languages.map((l, i) => (
          <li key={i}>
            <strong>
              <EditableText
                value={l.name}
                path={["languages", i, "name"]}
                ariaLabel={`Language ${i + 1} name`}
              />
              :
            </strong>{" "}
            <EditableText
              value={l.proficiency}
              path={["languages", i, "proficiency"]}
              ariaLabel={`Language ${i + 1} proficiency`}
            />
          </li>
        ))}
      </ul>
    </Section>
  )
}
