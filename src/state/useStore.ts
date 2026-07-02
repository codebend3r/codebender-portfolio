import { create } from "zustand"

import data from "@data/resume.json"

import { getAtPath } from "@utils/getAtPath"
import { moveItem } from "@utils/moveItem"
import { normalizeData } from "@utils/normalizeData"
import { setPath } from "@utils/setPath"

const NEW_EXPERIENCE: Experience = {
  role: "New Role",
  company: "Company",
  period: "MM/YYYY - Present",
  achievements: ["Achievement"],
}

export const useStore = create<ResumeStore>((set, get) => ({
  ...normalizeData(structuredClone(data) as Data),

  loadData: (next) => set(normalizeData(structuredClone(next))),

  setPath: (path, value) => set(setPath(get(), path, value)),

  reorder: (path, from, to) => {
    const state = get()
    const list = getAtPath(state, path)
    if (!Array.isArray(list)) return
    const next = moveItem(list, from, to)
    if (!next) return
    set(setPath(state, path, next))
  },

  addExperience: () =>
    set({ work_experience: [...get().work_experience, { ...NEW_EXPERIENCE }] }),

  removeExperience: (index) =>
    set({
      work_experience: get().work_experience.filter((_, i) => i !== index),
    }),

  addAchievement: (expIndex) =>
    set({
      work_experience: get().work_experience.map((w, i) =>
        i === expIndex
          ? { ...w, achievements: [...w.achievements, "New achievement"] }
          : w
      ),
    }),

  removeAchievement: (expIndex, achIndex) =>
    set({
      work_experience: get().work_experience.map((w, i) =>
        i === expIndex
          ? {
              ...w,
              achievements: w.achievements.filter((_, j) => j !== achIndex),
            }
          : w
      ),
    }),
}))
