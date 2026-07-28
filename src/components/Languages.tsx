import { Section } from "@components/Section"

import { EditableText } from "@edit/EditableText"
import { useEditing } from "@edit/EditContext"
import { SortableItem, SortableList } from "@edit/SortableList"
import sortStyles from "@edit/SortableList.module.css"

import { useStore } from "@state/useStore"

export function Languages({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { languages } = useStore()
  const { editing } = useEditing()
  const store = useStore.getState()

  return (
    <Section title="Languages" index={index} eyebrow={eyebrow}>
      <SortableList
        count={languages.length}
        onReorder={(from, to) => store.reorder(["languages"], from, to)}
      >
        <ul className={editing ? sortStyles.cardList : undefined}>
          {languages.map((l, i) => (
            <SortableItem
              key={i}
              index={i}
              label={`language ${i + 1}`}
              className={editing ? sortStyles.rowCard : undefined}
            >
              {(handle) => (
                <>
                  {handle}
                  <span>
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
