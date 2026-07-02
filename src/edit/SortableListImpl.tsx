import { useMemo } from "react"
import type { ReactNode } from "react"

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { useEditing } from "@edit/EditContext"
import styles from "@edit/SortableList.module.css"
import { SortableItemImplContext } from "@edit/sortableContext"
import type { SortableItemProps } from "@edit/sortableContext"

export function makeDragEndHandler(
  onReorder: (from: number, to: number) => void,
  markDirty: () => void
) {
  return ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    onReorder(Number(active.id), Number(over.id))
    markDirty()
  }
}

function SortableItemImpl({
  index,
  label,
  as: As = "li",
  className,
  dragWholeItem,
  wrapperProps,
  children,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(index) })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const wrapperClass = [className, isDragging && styles.dragging]
    .filter(Boolean)
    .join(" ")

  if (dragWholeItem) {
    return (
      <As
        {...wrapperProps}
        ref={setNodeRef}
        style={style}
        className={[wrapperClass, styles.wholeItem].filter(Boolean).join(" ")}
        {...attributes}
        {...listeners}
      >
        {children(null)}
      </As>
    )
  }

  return (
    <As
      {...wrapperProps}
      ref={setNodeRef}
      style={style}
      className={wrapperClass || undefined}
    >
      {children(
        <button
          type="button"
          ref={setActivatorNodeRef}
          className={styles.handle}
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${label}`}
        >
          ⠿
        </button>
      )}
    </As>
  )
}

export default function SortableListImpl({
  count,
  onReorder,
  children,
}: {
  count: number
  onReorder: (from: number, to: number) => void
  children: ReactNode
}) {
  const { markDirty } = useEditing()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const ids = useMemo(
    () => Array.from({ length: count }, (_, i) => String(i)),
    [count]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={makeDragEndHandler(onReorder, markDirty)}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <SortableItemImplContext.Provider value={SortableItemImpl}>
          {children}
        </SortableItemImplContext.Provider>
      </SortableContext>
    </DndContext>
  )
}
