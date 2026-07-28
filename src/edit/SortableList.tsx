import { Suspense, lazy, useContext } from "react"
import type { ReactNode } from "react"

import { useEditing } from "@edit/EditContext"
import { SortableItemImplContext } from "@edit/sortableContext"
import type { SortableItemProps } from "@edit/sortableContext"

// dnd-kit only ships in the lazy chunk, so the public page never loads it.
const SortableListImpl = lazy(() => import("@edit/SortableListImpl"))

export function SortableList({
  count,
  onReorder,
  children,
}: {
  count: number
  onReorder: (from: number, to: number) => void
  children: ReactNode
}) {
  const { editing } = useEditing()
  if (!editing) return <>{children}</>
  return (
    <Suspense fallback={children}>
      <SortableListImpl count={count} onReorder={onReorder}>
        {children}
      </SortableListImpl>
    </Suspense>
  )
}

export function SortableItem(props: SortableItemProps) {
  const Impl = useContext(SortableItemImplContext)
  // Impl is a module-level component provided via context by the lazy chunk,
  // not a component created during this render, so its state is stable.
  if (Impl) return <Impl {...props} />
  const { as: As = "li", className, wrapperProps, children } = props
  return (
    <As {...wrapperProps} className={className}>
      {children(null)}
    </As>
  )
}
