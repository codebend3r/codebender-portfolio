import raw from "@data/resume.json"

import { narrowEmployment } from "@utils/employment"

// The JSON module infers `schedule`/`arrangement` as plain strings; the
// guards narrow them to the literal unions without casts. Invalid values
// become `undefined`, which `resumeData.test.ts` treats as a data error.
export const resumeData: Data = {
  ...raw,
  work_experience: raw.work_experience.map(narrowEmployment),
}
