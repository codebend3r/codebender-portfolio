import { Section } from "@components/Section"

import { useEditing } from "@edit/EditContext"
import { EditableText } from "@edit/EditableText"
import { SortableItem, SortableList } from "@edit/SortableList"
import sortStyles from "@edit/SortableList.module.css"

import { useStore } from "@state/useStore"

export function Education({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { education } = useStore()
  const { editing } = useEditing()
  const store = useStore.getState()

  return (
    <Section title="Education" index={index} eyebrow={eyebrow}>
      <SortableList
        count={education.length}
        onReorder={(from, to) => store.reorder(["education"], from, to)}
      >
        <ul className={editing ? sortStyles.cardList : undefined}>
          {education.map((e, i) => (
            <SortableItem
              key={i}
              index={i}
              label={`education ${i + 1}`}
              className={editing ? sortStyles.rowCard : undefined}
            >
              {(handle) => (
                <>
                  {handle}
                  <span>
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
                  </span>
                </>
              )}
            </SortableItem>
          ))}
        </ul>
      </SortableList>
    </Section>
  )
}
