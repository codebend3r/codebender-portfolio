import { createContext } from "react"
import type { ComponentType, ElementType, ReactNode } from "react"

export type SortableItemProps = {
  index: number
  label: string
  as?: ElementType
  className?: string
  dragWholeItem?: boolean
  // Extra props forwarded to the wrapper element (aria attributes, hover
  // handlers, ...) since SortableItem owns the element it renders.
  wrapperProps?: Record<string, unknown>
  children: (handle: ReactNode) => ReactNode
}

// Holds the dnd-kit-backed item renderer while a SortableList is active.
// Null means no drag infrastructure (public page, or edit chunk still
// loading), in which case SortableItem renders a plain wrapper element.
export const SortableItemImplContext =
  createContext<ComponentType<SortableItemProps> | null>(null)
