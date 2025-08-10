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

type Data = {
  name: string
  contact: { email: string; phone: string; location: string; github: string }
  title: string
  summary: string
  technical_skills: string[]
  work_experience: Experience[]
  awards: Award[]
  languages: Language[]
  education: Education[]
}
