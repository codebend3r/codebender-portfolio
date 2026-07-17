import resume from "../../../src/data/resume.json"
import { narrowEmployment } from "../../../src/utils/employment"

// Functions have no tsconfig path aliases, so this mirrors the app's
// `@data/resumeData` loader with relative imports: the JSON module infers
// `schedule`/`arrangement` as plain strings and the guards narrow them.
export const baseResume: Data = {
  ...resume,
  work_experience: resume.work_experience.map(narrowEmployment),
}
