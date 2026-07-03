// Merges the sparse model output over the base resume. The model only
// returns the tailored fields (see PATCH_SCHEMA in prompt.ts) so generations
// stay small enough to finish inside Netlify's function time limit.
export function applyResumePatch(base: Data, patch: ResumePatch): Data {
  const work_experience = base.work_experience.map((exp) => ({
    ...exp,
    achievements: [...exp.achievements],
  }))
  for (const { index, achievements } of patch.work_experience) {
    if (index >= 0 && index < work_experience.length) {
      work_experience[index] = { ...work_experience[index], achievements }
    }
  }

  // Descriptions come from the base resume so they can never fall out of
  // alignment with the model's skill selection.
  const descriptionBySkill = new Map(
    base.technical_skills.map((skill, i) => [
      skill,
      base.skill_descriptions[i] ?? "",
    ])
  )

  return {
    ...base,
    title: patch.title,
    summary: patch.summary,
    technical_skills: patch.technical_skills,
    skill_descriptions: patch.technical_skills.map(
      (skill) => descriptionBySkill.get(skill) ?? ""
    ),
    work_experience,
  }
}
