import { create } from "zustand"

import data from "@data/resume.json"

import { setPath } from "@utils/setPath"

const NEW_EXPERIENCE: Experience = {
  role: "New Role",
  company: "Company",
  period: "MM/YYYY - Present",
  achievements: ["Achievement"],
}

function getAtPath(obj: unknown, path: PathKey[]): unknown {
  return path.reduce<unknown>(
    (acc, key) => (acc as Record<PathKey, unknown> | undefined)?.[key],
    obj
  )
}

export const useStore = create<ResumeStore>((set, get) => ({
  ...(structuredClone(data) as Data),

  loadData: (next) => set(structuredClone(next)),

  setPath: (path, value) => set(setPath(get(), path, value)),

  reorder: (path, from, to) => {
    const state = get()
    const list = getAtPath(state, path)
    if (!Array.isArray(list)) return
    if (from === to) return
    if (from < 0 || from >= list.length || to < 0 || to >= list.length) return
    const next = [...list]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
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
