export type Language = { name: string; proficiency: string }
export type Award = { name: string; organization: string; year: number }
export type Education = {
  program: string
  institution: string
  details?: string
}
export type Experience = {
  role: string
  company: string
  period: string
  achievements: string[]
}
export type Data = {
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
