import { Injectable } from "@angular/core"

import { resumeData } from "@data/resumeData"

import { normalizeData } from "@utils/normalizeData"

// Read-only resume model for the public Angular homepage. The page renders
// the checked-in `resume.json` only; no store, no cloud sync.
@Injectable({ providedIn: "root" })
export class ResumeDataService {
  readonly data: Data = normalizeData(structuredClone(resumeData))
}
