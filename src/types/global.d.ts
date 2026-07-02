type Language = { name: string; proficiency: string }

type Award = { name: string; organization: string; year: number }

type Education = {
  program: string
  institution: string
  details?: string
}

type Experience = {
  role: string
  company: string
  period: string
  achievements: string[]
}

type Showcase = {
  name: string
  domain: string
  url: string
  role: string
  period: string
  description: string
  image: string
  tags: string[]
}

type ContactEntry = { label: string; value: string }

type Data = {
  name: string
  contact: ContactEntry[]
  title: string
  summary: string
  technical_skills: string[]
  skill_descriptions: string[]
  work_experience: Experience[]
  awards: Award[]
  languages: Language[]
  education: Education[]
  showcase: Showcase[]
}

type PathKey = string | number

type ResumeActions = {
  loadData: (data: Data) => void
  setPath: (path: PathKey[], value: unknown) => void
  reorder: (path: PathKey[], from: number, to: number) => void
  addExperience: () => void
  removeExperience: (index: number) => void
  addAchievement: (expIndex: number) => void
  removeAchievement: (expIndex: number, achIndex: number) => void
}

type ResumeStore = Data & ResumeActions

type Variation = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  data: Data
}
