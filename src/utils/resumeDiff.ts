export type ResumeDiff = {
  title: boolean
  summary: boolean
  // skills in the generated resume that are not in the base skill list
  newSkills: Set<string>
  // changedAchievements[wi][ai] — bullet not present in the base entry
  changedAchievements: boolean[][]
}

/**
 * Flags what a generated resume changed relative to the base resume so the
 * review preview can highlight it. Achievement bullets match by content
 * within their entry, so reordering alone is not flagged.
 */
export function diffResume({
  base,
  generated,
}: {
  base: Data
  generated: Data
}): ResumeDiff {
  const baseSkills = new Set(base.technical_skills)
  return {
    title: generated.title !== base.title,
    summary: generated.summary !== base.summary,
    newSkills: new Set(
      generated.technical_skills.filter((skill) => !baseSkills.has(skill))
    ),
    changedAchievements: generated.work_experience.map((exp, i) => {
      const baseAchievements = new Set(
        base.work_experience[i]?.achievements ?? []
      )
      return exp.achievements.map(
        (achievement) => !baseAchievements.has(achievement)
      )
    }),
  }
}
