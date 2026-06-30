import { createContext, useContext } from "react"
import type { ReactNode } from "react"

type EditContextValue = {
  editing: boolean
  markDirty: () => void
}

const EditContext = createContext<EditContextValue>({
  editing: false,
  markDirty: () => {},
})

export function EditProvider({
  editing,
  markDirty,
  children,
}: {
  editing: boolean
  markDirty: () => void
  children: ReactNode
}) {
  return (
    <EditContext.Provider value={{ editing, markDirty }}>
      {children}
    </EditContext.Provider>
  )
}

export function useEditing(): EditContextValue {
  return useContext(EditContext)
}
