import { createContext, useContext } from "react"

import type { ResumeDiff } from "@utils/resumeDiff"

// Provided by the generate preview so resume sections can flag lines that
// differ from the base resume; null everywhere else (no highlighting).
const DiffContext = createContext<ResumeDiff | null>(null)

export const DiffProvider = DiffContext.Provider

export function useDiff(): ResumeDiff | null {
  return useContext(DiffContext)
}
