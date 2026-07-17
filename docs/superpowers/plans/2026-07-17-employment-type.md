# Employment Type on Work Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record full-time/part-time (`schedule`) and contract/permanent (`arrangement`) on every work-experience entry and render the label in the web timeline, PDF, DOCX, and Angular outputs, editable via dropdowns in `/edit`.

**Architecture:** Two optional literal-union fields on `Experience`, a formatter + type guards in `src/utils/employment.ts`, and a guard-narrowing `src/data/resumeData.ts` loader that replaces direct `resume.json` imports (the JSON module infers `schedule` as `string`, which is not assignable to the union — the loader narrows without casts and removes two existing `as Data` casts).

**Tech Stack:** React 19 + Vite, Zustand, @react-pdf/renderer, docx, Angular 20, Vitest.

## Global Constraints

- All scripts through Bun (`bun run test`, `bun run lint`, `bun run build`); never npm/yarn
- No `any`, no type casts (`as`), no nested ternaries; prefer type guards, `?.` paired with `??`, `!!` for boolean conversion
- Prefer `Array.prototype` methods over `for` loops; never `for/in` or `for/of`
- Single configurable object parameter over positional parameters
- Unit test all type guard functions; tests co-located (`lib/foo.ts` ↔ `lib/foo.test.ts`)
- Aliased imports only (`@utils/*`, `@data/*`, `@edit/*`, `@components/*`, `@ngapp/*`)
- Commit per task, subject `CJR: <lowercase imperative>`, bullet bodies, backticked identifiers, zero AI attribution
- Pre-commit runs `prettier --check`, `tsc` (app + `netlify/functions`), `eslint`, `vitest run` — run `bun run prettier` before each commit

---

### Task 1: Employment types, guards, formatter

**Files:**

- Modify: `src/types/global.d.ts:11-16` (Experience type)
- Create: `src/utils/employment.ts`
- Test: `src/utils/employment.test.ts`

**Interfaces:**

- Produces: ambient types `EmploymentSchedule = "full-time" | "part-time"`, `EmploymentArrangement = "contract" | "permanent"`; `Experience` gains optional `schedule`/`arrangement`
- Produces: `isEmploymentSchedule(value: unknown): value is EmploymentSchedule`, `isEmploymentArrangement(value: unknown): value is EmploymentArrangement`, `formatEmployment({ schedule, arrangement }): string | null`, `scheduleOptions` / `arrangementOptions` (`readonly { value: string; label: string }[]`)

- [ ] **Step 1: Add the ambient types**

In `src/types/global.d.ts`, insert above `type Experience`:

```ts
type EmploymentSchedule = "full-time" | "part-time"

type EmploymentArrangement = "contract" | "permanent"
```

and extend `Experience`:

```ts
type Experience = {
  role: string
  company: string
  period: string
  schedule?: EmploymentSchedule
  arrangement?: EmploymentArrangement
  achievements: string[]
}
```

- [ ] **Step 2: Write the failing test**

Create `src/utils/employment.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import {
  arrangementOptions,
  formatEmployment,
  isEmploymentArrangement,
  isEmploymentSchedule,
  scheduleOptions,
} from "@utils/employment"

describe("isEmploymentSchedule", () => {
  it("accepts the schedule literals", () => {
    expect(isEmploymentSchedule("full-time")).toBe(true)
    expect(isEmploymentSchedule("part-time")).toBe(true)
  })

  it("rejects other values", () => {
    expect(isEmploymentSchedule("contract")).toBe(false)
    expect(isEmploymentSchedule("")).toBe(false)
    expect(isEmploymentSchedule(undefined)).toBe(false)
    expect(isEmploymentSchedule(7)).toBe(false)
  })
})

describe("isEmploymentArrangement", () => {
  it("accepts the arrangement literals", () => {
    expect(isEmploymentArrangement("contract")).toBe(true)
    expect(isEmploymentArrangement("permanent")).toBe(true)
  })

  it("rejects other values", () => {
    expect(isEmploymentArrangement("full-time")).toBe(false)
    expect(isEmploymentArrangement("")).toBe(false)
    expect(isEmploymentArrangement(null)).toBe(false)
    expect(isEmploymentArrangement({})).toBe(false)
  })
})

describe("formatEmployment", () => {
  it("joins schedule and arrangement with a middle dot", () => {
    expect(
      formatEmployment({ schedule: "full-time", arrangement: "contract" })
    ).toBe("Full-time · Contract")
  })

  it("formats a lone schedule", () => {
    expect(formatEmployment({ schedule: "part-time" })).toBe("Part-time")
  })

  it("formats a lone arrangement", () => {
    expect(formatEmployment({ arrangement: "permanent" })).toBe("Permanent")
  })

  it("returns null when both are absent", () => {
    expect(formatEmployment({})).toBe(null)
  })
})

describe("options", () => {
  it("pairs values with display labels", () => {
    expect(scheduleOptions).toEqual([
      { value: "full-time", label: "Full-time" },
      { value: "part-time", label: "Part-time" },
    ])
    expect(arrangementOptions).toEqual([
      { value: "contract", label: "Contract" },
      { value: "permanent", label: "Permanent" },
    ])
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun run test src/utils/employment.test.ts`
Expected: FAIL — cannot resolve `@utils/employment`

- [ ] **Step 4: Write the implementation**

Create `src/utils/employment.ts`:

```ts
const SCHEDULES: readonly EmploymentSchedule[] = ["full-time", "part-time"]

const ARRANGEMENTS: readonly EmploymentArrangement[] = ["contract", "permanent"]

const LABELS: Record<EmploymentSchedule | EmploymentArrangement, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  permanent: "Permanent",
}

type EmploymentOption = { value: string; label: string }

export const isEmploymentSchedule = (
  value: unknown
): value is EmploymentSchedule =>
  SCHEDULES.some((schedule) => schedule === value)

export const isEmploymentArrangement = (
  value: unknown
): value is EmploymentArrangement =>
  ARRANGEMENTS.some((arrangement) => arrangement === value)

export const scheduleOptions: readonly EmploymentOption[] = SCHEDULES.map(
  (value) => ({ value, label: LABELS[value] })
)

export const arrangementOptions: readonly EmploymentOption[] = ARRANGEMENTS.map(
  (value) => ({ value, label: LABELS[value] })
)

export const formatEmployment = ({
  schedule,
  arrangement,
}: Pick<Experience, "schedule" | "arrangement">): string | null => {
  const label = [schedule, arrangement]
    .filter(
      (part): part is EmploymentSchedule | EmploymentArrangement => !!part
    )
    .map((part) => LABELS[part])
    .join(" · ")
  return label || null
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test src/utils/employment.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 6: Commit**

```bash
bun run prettier
git add src/types/global.d.ts src/utils/employment.ts src/utils/employment.test.ts
git commit -m "$(cat <<'EOF'
CJR: add employment type guards and formatter

- `EmploymentSchedule` + `EmploymentArrangement` unions on `Experience`
- `isEmploymentSchedule` / `isEmploymentArrangement` guards with tests
- `formatEmployment` joins labels with a middle dot, `null` when unset
- `scheduleOptions` / `arrangementOptions` for the edit dropdowns
EOF
)"
```

---

### Task 2: Classified data + typed loader

**Files:**

- Modify: `src/data/resume.json` (all 16 `work_experience` entries)
- Create: `src/data/resumeData.ts`
- Test: `src/data/resumeData.test.ts`
- Modify: `src/state/useStore.ts:3,18`
- Modify: `src/angular/services/resume-data.service.ts:3,11`
- Modify: `src/edit/EditResumeApp.tsx:12,30`
- Modify: `src/generate/GeneratePreview.tsx:13,21`
- Modify: `src/generate/GenerateApp.tsx:5,21`
- Modify: `scripts/generate-cv-pdf.tsx:10,41`
- Modify: `src/test/resumeFixture.ts:13-18`

**Interfaces:**

- Consumes: `isEmploymentSchedule` / `isEmploymentArrangement` from Task 1
- Produces: `resumeData: Data` exported from `@data/resumeData` — the only typed entry point for the base resume; direct `@data/resume.json` imports remain only in tests

- [ ] **Step 1: Add `schedule`/`arrangement` to every entry in `resume.json`**

Insert both keys between `"period"` and `"achievements"` in each entry, using exactly these values:

| Company (period)                        | schedule    | arrangement |
| --------------------------------------- | ----------- | ----------- |
| The Globe and Mail (09/2024 - 05/2026)  | `full-time` | `contract`  |
| iPolitics (11/2023 - Present)           | `part-time` | `contract`  |
| Robots and Pencils (06/2024 - 09/2024)  | `full-time` | `contract`  |
| XP Ventures Labs (03/2024 - 05/2024)    | `full-time` | `contract`  |
| Radian (06/2022 - 11/2023)              | `full-time` | `contract`  |
| Varicent (01/2021 - 06/2022)            | `full-time` | `permanent` |
| Myplanet (12/2020 - 02/2021)            | `full-time` | `contract`  |
| RBC Capital Markets (08/2020 - 12/2020) | `full-time` | `contract`  |
| RBC Ventures (08/2019 - 08/2020)        | `full-time` | `contract`  |
| Toronto Star (12/2018 - 08/2019)        | `full-time` | `contract`  |
| The Globe and Mail (05/2016 - 04/2018)  | `full-time` | `permanent` |
| theScore (01/2016 - 05/2016)            | `full-time` | `contract`  |
| Rogers (11/2014 - 01/2016)              | `full-time` | `contract`  |
| Uptime Software (04/2014 - 11/2014)     | `full-time` | `permanent` |
| Kobo Inc. (02/2012 - 03/2014)           | `full-time` | `permanent` |
| Research Now (07/2008 - 09/2011)        | `full-time` | `permanent` |

Example (first entry):

```json
{
  "role": "Senior Frontend Engineer",
  "company": "The Globe and Mail",
  "period": "09/2024 - 05/2026",
  "schedule": "full-time",
  "arrangement": "contract",
  "achievements": [
```

- [ ] **Step 2: Write the failing loader test**

Create `src/data/resumeData.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { resumeData } from "@data/resumeData"

describe("resumeData", () => {
  it("narrows schedule and arrangement on every entry", () => {
    const allTyped = resumeData.work_experience.every(
      (entry) => !!entry.schedule && !!entry.arrangement
    )
    expect(allTyped).toBe(true)
  })

  it("keeps every base field intact", () => {
    expect(resumeData.name).toBe("CJ Rivas")
    expect(resumeData.work_experience.length).toBe(16)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun run test src/data/resumeData.test.ts`
Expected: FAIL — cannot resolve `@data/resumeData`

- [ ] **Step 4: Write the loader**

Create `src/data/resumeData.ts`:

```ts
import raw from "@data/resume.json"

import {
  isEmploymentArrangement,
  isEmploymentSchedule,
} from "@utils/employment"

// The JSON module infers `schedule`/`arrangement` as plain strings; the
// guards narrow them to the literal unions without casts. Invalid values
// become `undefined`, which `resumeData.test.ts` treats as a data error.
export const resumeData: Data = {
  ...raw,
  work_experience: raw.work_experience.map((entry) => ({
    ...entry,
    schedule: isEmploymentSchedule(entry.schedule) ? entry.schedule : undefined,
    arrangement: isEmploymentArrangement(entry.arrangement)
      ? entry.arrangement
      : undefined,
  })),
}
```

- [ ] **Step 5: Swap the five non-test import sites to the loader**

`src/state/useStore.ts` — replace `import data from "@data/resume.json"` with `import { resumeData } from "@data/resumeData"`, and:

```ts
export const useStore = create<ResumeStore>((set, get) => ({
  ...normalizeData(structuredClone(resumeData)),
```

`src/angular/services/resume-data.service.ts` — replace the json import with `import { resumeData } from "@data/resumeData"`, and:

```ts
readonly data: Data = normalizeData(structuredClone(resumeData))
```

`src/edit/EditResumeApp.tsx` — replace `import resume from "@data/resume.json"` with `import { resumeData } from "@data/resumeData"`, and:

```ts
const initialData = active?.data ?? resumeData
```

`src/generate/GeneratePreview.tsx` and `src/generate/GenerateApp.tsx` — replace `import resume from "@data/resume.json"` with `import { resumeData as baseResume } from "@data/resumeData"` and delete the `const baseResume: Data = resume` line in each.

`scripts/generate-cv-pdf.tsx` — replace `import resume from "@data/resume.json"` with `import { resumeData } from "@data/resumeData"`, and:

```ts
const data = normalizeData(structuredClone(resumeData))
```

- [ ] **Step 6: Add the fields to `resumeFixture`**

In `src/test/resumeFixture.ts`, the Babbage entry becomes:

```ts
work_experience: [
  {
    role: "Engine Analyst",
    company: "Babbage & Co",
    period: "1842 – 1843",
    schedule: "full-time",
    arrangement: "permanent",
    achievements: ["Wrote the first algorithm", "Annotated the memoir"],
  },
],
```

- [ ] **Step 7: Run the full suite to verify nothing broke**

Run: `bun run test`
Expected: PASS, including the two new `resumeData` tests

- [ ] **Step 8: Commit**

```bash
bun run prettier
git add -A
git commit -m "$(cat <<'EOF'
CJR: classify all stints and add typed `resumeData` loader

- `schedule` + `arrangement` on all 16 `resume.json` entries
- `resumeData` narrows the JSON through the employment guards, cast-free
- swap `useStore`, Angular service, `EditResumeApp`, generate apps to loader
- drop two `as Data` casts; `resumeFixture` gains the new fields
EOF
)"
```

---

### Task 3: Web timeline label + edit dropdowns

**Files:**

- Create: `src/edit/EditableSelect.tsx`
- Test: `src/edit/EditableSelect.test.tsx`
- Modify: `src/components/WorkExperience.tsx`
- Modify: `src/components/WorkExperience.module.css:55-74`
- Modify: `src/state/useStore.ts:10-15`
- Test: `src/components/WorkExperience.test.tsx`

**Interfaces:**

- Consumes: `formatEmployment`, `isEmploymentSchedule`, `isEmploymentArrangement`, `scheduleOptions`, `arrangementOptions` from `@utils/employment`
- Produces: `EditableSelect({ value, options, placeholder, ariaLabel, onCommit })` — presentational select, callers render it only in edit mode

- [ ] **Step 1: Write the failing `EditableSelect` test**

Create `src/edit/EditableSelect.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { EditProvider } from "@edit/EditContext"
import { EditableSelect } from "@edit/EditableSelect"

const OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
]

function renderSelect({
  onCommit,
  markDirty,
}: {
  onCommit: (next: string) => void
  markDirty: () => void
}) {
  return render(
    <EditProvider editing markDirty={markDirty}>
      <EditableSelect
        value="full-time"
        options={OPTIONS}
        placeholder="schedule"
        ariaLabel="Schedule"
        onCommit={onCommit}
      />
    </EditProvider>
  )
}

describe("EditableSelect", () => {
  it("commits the chosen value and marks dirty", () => {
    const onCommit = vi.fn()
    const markDirty = vi.fn()
    renderSelect({ onCommit, markDirty })
    fireEvent.change(screen.getByRole("combobox", { name: "Schedule" }), {
      target: { value: "part-time" },
    })
    expect(onCommit).toHaveBeenCalledWith("part-time")
    expect(markDirty).toHaveBeenCalled()
  })

  it("offers a placeholder option that commits an empty string", () => {
    const onCommit = vi.fn()
    renderSelect({ onCommit, markDirty: () => {} })
    fireEvent.change(screen.getByRole("combobox", { name: "Schedule" }), {
      target: { value: "" },
    })
    expect(onCommit).toHaveBeenCalledWith("")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/edit/EditableSelect.test.tsx`
Expected: FAIL — cannot resolve `@edit/EditableSelect`

- [ ] **Step 3: Implement `EditableSelect`**

Create `src/edit/EditableSelect.tsx`:

```tsx
import { useEditing } from "@edit/EditContext"
import styles from "@edit/EditableText.module.css"

export function EditableSelect({
  value,
  options,
  placeholder,
  ariaLabel,
  onCommit,
}: {
  value: string
  options: readonly { value: string; label: string }[]
  placeholder: string
  ariaLabel: string
  onCommit: (next: string) => void
}) {
  const { markDirty } = useEditing()

  return (
    <select
      className={styles.field}
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => {
        onCommit(event.target.value)
        markDirty()
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/edit/EditableSelect.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the failing `WorkExperience` tests**

Add to the read-only `describe` in `src/components/WorkExperience.test.tsx`:

```tsx
it("shows the employment label under the period", () => {
  render(<WorkExperience />)
  expect(
    screen.getAllByText("Full-time · Contract").length
  ).toBeGreaterThanOrEqual(1)
  expect(
    screen.getAllByText("Part-time · Contract").length
  ).toBeGreaterThanOrEqual(1)
  expect(
    screen.getAllByText("Full-time · Permanent").length
  ).toBeGreaterThanOrEqual(1)
})
```

Add to the editing `describe`:

```tsx
it("updates schedule through the dropdown", () => {
  renderEditing()
  fireEvent.change(screen.getAllByRole("combobox", { name: /schedule/i })[0], {
    target: { value: "part-time" },
  })
  expect(useStore.getState().work_experience[0].schedule).toBe("part-time")
})

it("clears arrangement when the placeholder is chosen", () => {
  renderEditing()
  fireEvent.change(
    screen.getAllByRole("combobox", { name: /arrangement/i })[0],
    { target: { value: "" } }
  )
  expect(useStore.getState().work_experience[0].arrangement).toBeUndefined()
})
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `bun run test src/components/WorkExperience.test.tsx`
Expected: FAIL — no employment labels, no comboboxes

- [ ] **Step 7: Render the label and dropdowns**

In `src/components/WorkExperience.tsx` add imports:

```tsx
import { EditableSelect } from "@edit/EditableSelect"

import {
  arrangementOptions,
  formatEmployment,
  isEmploymentArrangement,
  isEmploymentSchedule,
  scheduleOptions,
} from "@utils/employment"
```

Inside the map, next to `const duration = experienceDuration(w.period)`:

```tsx
const employment = formatEmployment(w)
```

After the `{duration && (...)}` block inside the `.period` span:

```tsx
{
  editing ? (
    <span className={styles.employment}>
      <EditableSelect
        value={w.schedule ?? ""}
        options={scheduleOptions}
        placeholder="schedule"
        ariaLabel={`Schedule ${wi + 1}`}
        onCommit={(next) =>
          store.setPath(
            ["work_experience", wi, "schedule"],
            isEmploymentSchedule(next) ? next : undefined
          )
        }
      />
      <EditableSelect
        value={w.arrangement ?? ""}
        options={arrangementOptions}
        placeholder="arrangement"
        ariaLabel={`Arrangement ${wi + 1}`}
        onCommit={(next) =>
          store.setPath(
            ["work_experience", wi, "arrangement"],
            isEmploymentArrangement(next) ? next : undefined
          )
        }
      />
    </span>
  ) : (
    !!employment && <span className={styles.employment}>{employment}</span>
  )
}
```

`EditableSelect` calls `markDirty` itself, so `onCommit` only writes through `store.setPath`, narrowing via the guards; the placeholder's empty string fails the guard and clears the field to `undefined`.

- [ ] **Step 8: Style the label**

In `src/components/WorkExperience.module.css`, after `.duration`:

```css
.employment {
  display: grid;
  gap: 2px;
  color: var(--muted);
  font-weight: 400;
  font-size: 12px;
}
```

and extend the existing width guard:

```css
.period input,
.period select {
  width: auto;
}
```

- [ ] **Step 9: Default new experiences**

In `src/state/useStore.ts`:

```ts
const NEW_EXPERIENCE: Experience = {
  role: "New Role",
  company: "Company",
  period: "MM/YYYY - Present",
  schedule: "full-time",
  arrangement: "permanent",
  achievements: ["Achievement"],
}
```

- [ ] **Step 10: Run tests to verify they pass**

Run: `bun run test src/components/WorkExperience.test.tsx src/edit/EditableSelect.test.tsx`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
bun run prettier
git add src/edit/EditableSelect.tsx src/edit/EditableSelect.test.tsx src/components/WorkExperience.tsx src/components/WorkExperience.module.css src/components/WorkExperience.test.tsx src/state/useStore.ts
git commit -m "$(cat <<'EOF'
CJR: show employment label on web timeline with edit dropdowns

- `formatEmployment` label under the period in `WorkExperience`
- new `EditableSelect` renders schedule/arrangement dropdowns in `/edit`
- guard-narrowed `setPath` commits; placeholder clears to `undefined`
- `NEW_EXPERIENCE` defaults to `full-time` / `permanent`
EOF
)"
```

---

### Task 4: PDF label

**Files:**

- Modify: `src/pdf/ResumePDF.tsx:138-157`
- Modify: `src/pdf/styles.ts:123-128`

**Interfaces:**

- Consumes: `formatEmployment` from `@utils/employment`

- [ ] **Step 1: Render the company/employment row**

In `src/pdf/ResumePDF.tsx`, add `import { formatEmployment } from "@utils/employment"` and change `ExperienceEntry`:

```tsx
function ExperienceEntry({ entry }: { entry: Experience }) {
  const employment = formatEmployment(entry)
  // wrap={false} keeps the whole entry on one page: when it does not fit
  // in the remaining space it moves to the next page instead of splitting.
  return (
    <View style={styles.experience} wrap={false}>
      <View style={styles.timelineDash} />
      <View style={styles.experienceHeader}>
        <Text style={styles.role}>{entry.role}</Text>
        <Text style={styles.period}>{entry.period}</Text>
      </View>
      <View style={styles.companyRow}>
        <Text style={styles.company}>{entry.company}</Text>
        {!!employment && <Text style={styles.employment}>{employment}</Text>}
      </View>
      {entry.achievements.map((a, i) => (
        <Text key={i} style={styles.achievement}>
          <Text style={styles.bullet}>{"•  "}</Text>
          {a}
        </Text>
      ))}
    </View>
  )
}
```

- [ ] **Step 2: Add the styles**

In `src/pdf/styles.ts`, replace the `company` block and add:

```ts
companyRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: tokens.spacing.md,
  marginBottom: 3,
},
company: {
  fontSize: tokens.fontSize.body,
  fontWeight: 600,
  color: tokens.colors.accent,
},
employment: {
  fontSize: tokens.fontSize.small,
  fontStyle: "italic",
  color: tokens.colors.muted,
},
```

(`company` loses its `marginBottom: 3`; the row owns it now.)

- [ ] **Step 3: Verify compile + suite**

Run: `bun run test` and `bun run ts:check`
Expected: PASS / no errors

- [ ] **Step 4: Commit**

```bash
bun run prettier
git add src/pdf/ResumePDF.tsx src/pdf/styles.ts
git commit -m "$(cat <<'EOF'
CJR: show employment label in PDF export

- `ExperienceEntry` company line becomes `companyRow` with label right
- `employment` style mirrors the muted italic `period`
EOF
)"
```

---

### Task 5: DOCX label

**Files:**

- Modify: `src/docx/ResumeDocx.ts:234-246`
- Test: `src/docx/ResumeDocx.test.ts`

**Interfaces:**

- Consumes: `formatEmployment` from `@utils/employment`

- [ ] **Step 1: Write the failing test**

Add to `src/docx/ResumeDocx.test.ts`:

```ts
it("renders the employment label after the company", async () => {
  const xml = strFromU8((await unzipDocument())["word/document.xml"])
  const company = xml.indexOf("Babbage &amp; Co")
  const employment = xml.indexOf("Full-time · Permanent")
  expect(company).toBeGreaterThanOrEqual(0)
  expect(employment).toBeGreaterThan(company)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/docx/ResumeDocx.test.ts`
Expected: FAIL — `employment` is `-1`

- [ ] **Step 3: Implement**

In `src/docx/ResumeDocx.ts`, add `import { formatEmployment } from "@utils/employment"`, compute `const employment = formatEmployment(entry)` at the top of `experienceParagraphs`, and change the company paragraph to:

```ts
new Paragraph({
  keepNext: true,
  keepLines: true,
  indent: { left: indent },
  spacing: { after: twips(3) },
  tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
  children: [
    new TextRun({
      text: entry.company,
      font: FONT_SEMIBOLD,
      color: hex(tokens.colors.accent),
    }),
    ...(employment
      ? [
          new TextRun({ children: [new Tab()] }),
          new TextRun({
            text: employment,
            italics: true,
            size: halfPoints(tokens.fontSize.small),
            color: hex(tokens.colors.muted),
          }),
        ]
      : []),
  ],
}),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/docx/ResumeDocx.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
bun run prettier
git add src/docx/ResumeDocx.ts src/docx/ResumeDocx.test.ts
git commit -m "$(cat <<'EOF'
CJR: show employment label in DOCX export

- company paragraph gains right tab stop with muted italic label
- ordering test pins label after `Babbage &amp; Co`
EOF
)"
```

---

### Task 6: Angular label

**Files:**

- Modify: `src/angular/components/work-experience.component.ts`
- Modify: `src/angular/components/work-experience.component.css`
- Test: `src/angular/components/work-experience.component.test.ts`

**Interfaces:**

- Consumes: `formatEmployment` from `@utils/employment`

- [ ] **Step 1: Write the failing test**

Add to `src/angular/components/work-experience.component.test.ts`:

```ts
it("renders the employment label for the first experience", async () => {
  const root = await render()
  const first = root.querySelector(".item")
  expect(first?.querySelector(".employment")?.textContent?.trim() ?? "").toBe(
    "Full-time · Contract"
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/angular/components/work-experience.component.test.ts`
Expected: FAIL — `.employment` missing

- [ ] **Step 3: Implement**

In `work-experience.component.ts`, add `import { formatEmployment } from "@utils/employment"`, extend the mapper:

```ts
readonly experiences = inject(ResumeDataService).data.work_experience.map(
  (experience) => ({
    ...experience,
    duration: experienceDuration(experience.period),
    employment: formatEmployment(experience),
  })
)
```

and extend the template's period span:

```html
<span class="period">
  {{ experience.period }} @if (experience.duration !== null) {
  <span class="duration">{{ experience.duration }}</span>
  } @if (experience.employment !== null) {
  <span class="employment">{{ experience.employment }}</span>
  }
</span>
```

In `work-experience.component.css`, after `.duration`:

```css
.employment {
  color: var(--muted);
  font-weight: 400;
  font-size: 12px;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/angular/components/work-experience.component.test.ts src/angular/services/resume-data.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
bun run prettier
git add src/angular/components/work-experience.component.ts src/angular/components/work-experience.component.css src/angular/components/work-experience.component.test.ts
git commit -m "$(cat <<'EOF'
CJR: show employment label on Angular route

- `employment` computed beside `duration` in `WorkExperienceComponent`
- label under the period, muted like `.duration`
EOF
)"
```

---

### Task 7: Full verification

- [ ] **Step 1: Full test suite** — Run: `bun run test` — Expected: PASS
- [ ] **Step 2: Lint** — Run: `bun run lint` — Expected: clean
- [ ] **Step 3: Build** — Run: `bun run build` — Expected: success
- [ ] **Step 4: Drive the app** — Run `bun dev`, open `http://localhost:4242`, confirm the label renders under each period on the homepage and `/angular-version`, and that `/edit-resume` shows the two dropdowns in edit mode. `/generate` routes need `bunx netlify-cli dev` (port 8888) and are unchanged by this feature.
