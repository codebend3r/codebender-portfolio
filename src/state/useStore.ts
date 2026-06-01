import { create } from "zustand"

import data from "@data/resume.json"

export const useStore = create<Data>(() => ({
  ...data,
}))
