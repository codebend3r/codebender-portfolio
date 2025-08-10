import { create } from "zustand"

import data from "@data/resume.json"

type StoreState = {
  name: string
  contact: {
    email: string
    phone: string
    location: string
    github: string
  }
  title: string
  summary: string
  technical_skills: string[]
  work_experience: Experience[]
  awards: Award[]
  languages: Language[]
  education: Education[]
}

export const useStore = create<StoreState>(() => ({
  ...data,
}))
