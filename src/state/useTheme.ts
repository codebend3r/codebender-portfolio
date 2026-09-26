import { create } from "zustand"

import { getStartupThemeChoice, storeThemeChoice } from "@utils/theme"
import type { ThemeChoice } from "@utils/theme"

type ThemeState = {
  choice: ThemeChoice
  setChoice: (choice: ThemeChoice) => void
}

// The ?theme= override wins for the session but is never persisted, so a
// shared screenshot link doesn't overwrite the viewer's saved preference.
export const useTheme = create<ThemeState>()((set) => ({
  choice: getStartupThemeChoice(),
  setChoice: (choice) => {
    storeThemeChoice(choice)
    set({ choice })
  },
}))
