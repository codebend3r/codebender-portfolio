import { Section } from "@components/Section"

import { EditableText } from "@edit/EditableText"
import { useEditing } from "@edit/EditContext"
import { SortableItem, SortableList } from "@edit/SortableList"
import sortStyles from "@edit/SortableList.module.css"

import { useStore } from "@state/useStore"

export function Awards({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { awards } = useStore()
  const { editing } = useEditing()
  const store = useStore.getState()

  return (
    <Section title="Awards" index={index} eyebrow={eyebrow}>
      <SortableList
        count={awards.length}
        onReorder={(from, to) => store.reorder(["awards"], from, to)}
      >
        <ul className={editing ? sortStyles.cardList : undefined}>
          {awards.map((a, i) => (
            <SortableItem
              key={i}
              index={i}
              label={`award ${i + 1}`}
              className={editing ? sortStyles.rowCard : undefined}
            >
              {(handle) => (
                <>
                  {handle}
                  <span>
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
