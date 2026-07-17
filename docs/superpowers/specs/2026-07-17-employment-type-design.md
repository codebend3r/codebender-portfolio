# Employment Type on Work Experience — Design

Date: 2026-07-17
Status: Approved

## Goal

Every work-experience entry records whether the stint was full-time or
part-time (**schedule**) and contract or permanent (**arrangement**), and the
label renders everywhere the resume does: web, PDF, DOCX, and the Angular
route.

## Data model

`src/types/global.d.ts`:

```ts
type EmploymentSchedule = "full-time" | "part-time"
type EmploymentArrangement = "contract" | "permanent"

type Experience = {
  role: string
  company: string
  period: string
  schedule?: EmploymentSchedule
  arrangement?: EmploymentArrangement
  achievements: string[]
}
```

Both fields are optional: saved variations (localStorage and cloud sync)
predate them, and must keep loading unchanged. Renderers omit the label when
the fields are absent.

## Classification (user-confirmed)

| Company             | Period          | Schedule  | Arrangement |
| ------------------- | --------------- | --------- | ----------- |
| The Globe and Mail  | 09/2024–05/2026 | full-time | contract    |
| iPolitics           | 11/2023–Present | part-time | contract    |
| Robots and Pencils  | 06/2024–09/2024 | full-time | contract    |
| XP Ventures Labs    | 03/2024–05/2024 | full-time | contract    |
| Radian              | 06/2022–11/2023 | full-time | contract    |
| Varicent            | 01/2021–06/2022 | full-time | permanent   |
| Myplanet            | 12/2020–02/2021 | full-time | contract    |
| RBC Capital Markets | 08/2020–12/2020 | full-time | contract    |
| RBC Ventures        | 08/2019–08/2020 | full-time | contract    |
| Toronto Star        | 12/2018–08/2019 | full-time | contract    |
| The Globe and Mail  | 05/2016–04/2018 | full-time | permanent   |
| theScore            | 01/2016–05/2016 | full-time | contract    |
| Rogers              | 11/2014–01/2016 | full-time | contract    |
| Uptime Software     | 04/2014–11/2014 | full-time | permanent   |
| Kobo Inc.           | 02/2012–03/2014 | full-time | permanent   |
| Research Now        | 07/2008–09/2011 | full-time | permanent   |

The Rogers stint was an agency placement (via mobileLIVE); the agency detail
does not fit the enum and is deliberately not captured.

## Formatter and type guards

New `src/utils/employment.ts` (+ co-located test):

- `isEmploymentSchedule(value: unknown): value is EmploymentSchedule`
- `isEmploymentArrangement(value: unknown): value is EmploymentArrangement`
- `formatEmployment({ schedule, arrangement })` → `"Full-time · Contract"`;
  handles either field alone (`"Full-time"`, `"Contract"`); returns `null`
  when both are absent.

Display casing: `Full-time`, `Part-time`, `Contract`, `Permanent`, joined
with `·`.

## Rendering

The label is styled like the muted period/duration text in each output:

- **Web** (`WorkExperience.tsx`): under the period, beside the duration.
- **PDF** (`ResumePDF.tsx`): the company line becomes company-left /
  employment-right, mirroring the role/period row above it.
- **DOCX** (`ResumeDocx.ts`): employment label appended to the company
  paragraph via the existing right tab stop, italic and muted like the
  period.
- **Angular** (`work-experience.component.ts`): same placement as web,
  computed alongside `duration`.

## Edit mode

New `src/edit/EditableSelect.tsx` (+ test), mirroring `EditableText`: shows
the formatted label when not editing; in edit mode renders two dropdowns
(schedule, arrangement) wired to `setPath`, each with a "not set" option that
clears the field to `undefined`. Select values are validated through the type
guards. `NEW_EXPERIENCE` in `useStore.ts` defaults to `full-time` /
`permanent`.

## Generate flow

No changes: the `/generate` patch replaces only per-entry achievements, so
`schedule`/`arrangement` flow through `applyResumePatch` untouched.

## Tests

- `resumeFixture` entries gain the fields.
- New tests: `employment.test.ts`, `EditableSelect.test.tsx`.
- Updated as needed: `WorkExperience.test.tsx`, Angular component/service
  tests, `ResumeDocx.test.ts`.

## Out of scope

- Showcase entries, awards, education.
- Capturing agency/placement details (e.g. mobileLIVE).
- Filtering or sorting by employment type.
