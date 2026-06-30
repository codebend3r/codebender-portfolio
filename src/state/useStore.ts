import { create } from "zustand"

import data from "@data/resume.json"

import { setPath } from "@utils/setPath"

const NEW_EXPERIENCE: Experience = {
  role: "New Role",
  company: "Company",
  period: "MM/YYYY - Present",
  achievements: ["Achievement"],
}

function swap<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

export const useStore = create<ResumeStore>((set, get) => ({
  ...(structuredClone(data) as Data),

  loadData: (next) => set(structuredClone(next)),

  setPath: (path, value) => set(setPath(get(), path, value)),

  addExperience: () =>
    set({ work_experience: [...get().work_experience, { ...NEW_EXPERIENCE }] }),

  removeExperience: (index) =>
    set({
      work_experience: get().work_experience.filter((_, i) => i !== index),
    }),

  moveExperience: (index, dir) =>
    set({ work_experience: swap(get().work_experience, index, dir) }),

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

  moveAchievement: (expIndex, achIndex, dir) =>
    set({
      work_experience: get().work_experience.map((w, i) =>
        i === expIndex
          ? { ...w, achievements: swap(w.achievements, achIndex, dir) }
          : w
      ),
    }),
}))
