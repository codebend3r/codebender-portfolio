import { Section } from "@components/Section"

import { EditableText } from "@edit/EditableText"
import { SortableItem, SortableList } from "@edit/SortableList"

import { useStore } from "@state/useStore"

export function Education({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { education } = useStore()
  const store = useStore.getState()

  return (
    <Section title="Education" index={index} eyebrow={eyebrow}>
      <SortableList
        count={education.length}
        onReorder={(from, to) => store.reorder(["education"], from, to)}
      >
        <ul>
          {education.map((e, i) => (
            <SortableItem key={i} index={i} label={`education ${i + 1}`}>
              {(handle) => (
                <>
                  {handle}{" "}
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
                </>
              )}
            </SortableItem>
          ))}
        </ul>
      </SortableList>
    </Section>
  )
}
