# Resume Variations + `/edit-resume` Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user create multiple named, editable variations of the resume on a hidden `/edit-resume` route and generate a PDF from any one, without ever mutating `resume.json`.

**Architecture:** Both the on-screen resume and the PDF render one `Data` object held in `useStore`. On `/edit-resume`, the active variation's data is loaded into `useStore` and the existing styled components become inline editors via an `EditableText` field gated by an `EditContext`. A separate `useVariations` store persists named variations to `localStorage`. `Entry.tsx` branches on `window.location.pathname` — no router library.

**Tech Stack:** Vite 8, React 19, TypeScript (strict), Zustand 5 (+ `persist` middleware), `@react-pdf/renderer`, plain CSS Modules, Vitest + Testing Library.

## Global Constraints

- Package manager is **bun**. Run scripts with `bun run <script>` (use `bun run build`, never `bun build`).
- **No new runtime dependencies.** Use `crypto.randomUUID()`, `structuredClone()`, and `zustand/middleware`'s `persist` — all verified available.
- **Aliased imports only.** Never write a relative import when an alias exists. Aliases live in BOTH `vite.config.ts` (`resolve.alias`) and `tsconfig.json` (`compilerOptions.paths`) and must stay in sync.
- **No CSS `margin`** for spacing — parent is a grid container, space children with `gap`. Narrow exceptions: `margin: 0 auto` centering and `margin: 0` resets.
- Every component pairs with a colocated `<Name>.module.css`. Reference tokens as `var(--accent)` etc.
- Prettier: no semicolons, double quotes, 2-space indent, `printWidth: 80`, `trailingComma: "es5"`. Type-only imports use `import type` (ESLint `consistent-type-imports`).
- **The public `/` page and `resume.json` must never change behavior.** Every existing test in `src/**/*.test.tsx` must stay green: `EditableText` in view mode renders the bare string (byte-identical DOM), and edit-only UI renders only when `editing` is true.
- Commit style (codebender-portfolio): subject `CJR: <lowercase imperative>`, bulleted body with `-`, backtick every code identifier/path, **no AI/agent attribution anywhere**.
- Each task ends green: `bun run test` passes and (final task) `bun run build` passes. The `.husky/pre-commit` hook runs `prettier:check → ts:check → lint → test`; a commit fails if any step fails.

## Shared interfaces (defined across tasks, referenced everywhere)

Ambient types added to `src/types/global.d.ts` (Tasks 2–3):

```ts
type PathKey = string | number

type ResumeActions = {
  loadData: (data: Data) => void
  setPath: (path: PathKey[], value: unknown) => void
  addExperience: () => void
  removeExperience: (index: number) => void
  moveExperience: (index: number, dir: -1 | 1) => void
  addAchievement: (expIndex: number) => void
  removeAchievement: (expIndex: number, achIndex: number) => void
  moveAchievement: (expIndex: number, achIndex: number, dir: -1 | 1) => void
}

type ResumeStore = Data & ResumeActions

type Variation = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  data: Data
}
```

`EditContext` value (Task 4): `{ editing: boolean; markDirty: () => void }`.

`EditableText` props (Task 5): `{ value: string; path: PathKey[]; multiline?: boolean; ariaLabel?: string }`.

---

### Task 1: `setPath` immutable set-by-path helper

**Files:**

- Create: `src/utils/setPath.ts`
- Test: `src/utils/setPath.test.ts`

**Interfaces:**

- Produces: `setPath<T>(obj: T, path: PathKey[], value: unknown): T` — returns a structurally-shared clone with `value` written at `path`; does not mutate `obj`. Empty path returns `value` cast to `T`.

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/setPath.test.ts
import { describe, expect, it } from "vitest"

import { setPath } from "@utils/setPath"

describe("setPath", () => {
  it("sets a top-level key without mutating the source", () => {
    const src = { name: "A", title: "T" }
    const next = setPath(src, ["name"], "B")
    expect(next).toEqual({ name: "B", title: "T" })
    expect(src.name).toBe("A")
    expect(next).not.toBe(src)
  })

  it("sets a nested object key", () => {
    const src = { contact: { email: "a@x.com", phone: "1" } }
    const next = setPath(src, ["contact", "email"], "b@x.com")
    expect(next.contact.email).toBe("b@x.com")
    expect(next.contact.phone).toBe("1")
    expect(src.contact.email).toBe("a@x.com")
  })

  it("sets a value at a nested array index", () => {
    const src = { work: [{ achievements: ["one", "two"] }] }
    const next = setPath(src, ["work", 0, "achievements", 1], "TWO")
    expect(next.work[0].achievements).toEqual(["one", "TWO"])
    expect(src.work[0].achievements[1]).toBe("two")
    expect(next.work).not.toBe(src.work)
  })

  it("returns the value when path is empty", () => {
    expect(setPath({ a: 1 }, [], { b: 2 })).toEqual({ b: 2 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/utils/setPath.test.ts`
Expected: FAIL — cannot find module `@utils/setPath`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/utils/setPath.ts
export function setPath<T>(obj: T, path: PathKey[], value: unknown): T {
  if (path.length === 0) return value as T
  const [head, ...rest] = path
  const clone: any = Array.isArray(obj) ? [...obj] : { ...obj }
  clone[head] = setPath(clone[head], rest, value)
  return clone
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/utils/setPath.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/setPath.ts src/utils/setPath.test.ts
git commit -m "$(cat <<'EOF'
CJR: add `setPath` immutable set-by-path helper

- `setPath(obj, path, value)` clones along the path, leaves source intact
- supports nested object keys and array indices
- empty path returns the value
EOF
)"
```

---

### Task 2: Extend `useStore` with edit actions

**Files:**

- Modify: `src/types/global.d.ts` (append `PathKey`, `ResumeActions`, `ResumeStore`)
- Modify: `src/state/useStore.ts`
- Test: `src/state/useStore.test.ts` (append a new `describe` block; leave existing tests intact)

**Interfaces:**

- Consumes: `setPath` (Task 1), ambient `Data`.
- Produces: `useStore` typed `ResumeStore`. Actions: `loadData`, `setPath`, `addExperience`, `removeExperience`, `moveExperience(index, dir)`, `addAchievement(expIndex)`, `removeAchievement(expIndex, achIndex)`, `moveAchievement(expIndex, achIndex, dir)`. `addExperience` appends `{ role: "New Role", company: "Company", period: "MM/YYYY - Present", achievements: ["Achievement"] }`. `addAchievement` appends `"New achievement"`. `move*` with `dir: -1|1` swaps with the neighbor and is a no-op at the boundary.

- [ ] **Step 1: Add ambient types**

Append to `src/types/global.d.ts` (after the existing `Data` type):

```ts
type PathKey = string | number

type ResumeActions = {
  loadData: (data: Data) => void
  setPath: (path: PathKey[], value: unknown) => void
  addExperience: () => void
  removeExperience: (index: number) => void
  moveExperience: (index: number, dir: -1 | 1) => void
  addAchievement: (expIndex: number) => void
  removeAchievement: (expIndex: number, achIndex: number) => void
  moveAchievement: (expIndex: number, achIndex: number, dir: -1 | 1) => void
}

type ResumeStore = Data & ResumeActions
```

- [ ] **Step 2: Write the failing tests**

Append to `src/state/useStore.test.ts`:

```ts
describe("useStore edit actions", () => {
  beforeEach(() => {
    useStore.getState().loadData(structuredClone(resume) as Data)
  })

  it("loadData replaces the data fields", () => {
    useStore.getState().loadData({
      ...(structuredClone(resume) as Data),
      name: "Changed Name",
    })
    expect(useStore.getState().name).toBe("Changed Name")
  })

  it("setPath updates a nested value immutably", () => {
    useStore.getState().setPath(["contact", "email"], "new@x.com")
    expect(useStore.getState().contact.email).toBe("new@x.com")
  })

  it("addExperience appends a new experience", () => {
    const before = useStore.getState().work_experience.length
    useStore.getState().addExperience()
    const after = useStore.getState().work_experience
    expect(after.length).toBe(before + 1)
    expect(after[after.length - 1].role).toBe("New Role")
  })

  it("removeExperience drops the experience at index", () => {
    const first = useStore.getState().work_experience[0].company
    useStore.getState().removeExperience(0)
    expect(useStore.getState().work_experience[0].company).not.toBe(first)
  })

  it("moveExperience swaps with the neighbor and no-ops at the edge", () => {
    const [a, b] = useStore.getState().work_experience
    useStore.getState().moveExperience(0, 1)
    expect(useStore.getState().work_experience[0].company).toBe(b.company)
    expect(useStore.getState().work_experience[1].company).toBe(a.company)
    useStore.getState().moveExperience(0, -1)
    expect(useStore.getState().work_experience[0].company).toBe(b.company)
  })

  it("addAchievement and removeAchievement mutate the bullet list", () => {
    const before = useStore.getState().work_experience[0].achievements.length
    useStore.getState().addAchievement(0)
    expect(useStore.getState().work_experience[0].achievements.length).toBe(
      before + 1
    )
    useStore.getState().removeAchievement(0, 0)
    expect(useStore.getState().work_experience[0].achievements.length).toBe(
      before
    )
  })

  it("moveAchievement swaps neighboring bullets", () => {
    const [a, b] = useStore.getState().work_experience[0].achievements
    useStore.getState().moveAchievement(0, 0, 1)
    const next = useStore.getState().work_experience[0].achievements
    expect(next[0]).toBe(b)
    expect(next[1]).toBe(a)
  })
})
```

Add `beforeEach` to the existing vitest import line and (if not present) import nothing else new — `resume` and `useStore` are already imported at the top of the file.

- [ ] **Step 3: Run tests to verify they fail**

Run: `bun run test src/state/useStore.test.ts`
Expected: FAIL — `loadData is not a function`.

- [ ] **Step 4: Implement the store**

Replace `src/state/useStore.ts` with:

```ts
import { create } from "zustand"

import data from "@data/resume.json"

import { setPath } from "@utils/setPath"

const NEW_EXPERIENCE: Experience = {
  role: "New Role",
  company: "Company",
  period: "MM/YYYY - Present",
  achievements: ["Achievement"],
}

function swap<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

export const useStore = create<ResumeStore>((set, get) => ({
  ...(structuredClone(data) as Data),

  loadData: (next) => set(structuredClone(next)),

  setPath: (path, value) => set(setPath(get(), path, value)),

  addExperience: () =>
    set({ work_experience: [...get().work_experience, { ...NEW_EXPERIENCE }] }),

  removeExperience: (index) =>
    set({
      work_experience: get().work_experience.filter((_, i) => i !== index),
    }),

  moveExperience: (index, dir) =>
    set({ work_experience: swap(get().work_experience, index, dir) }),

  addAchievement: (expIndex) =>
    set({
      work_experience: get().work_experience.map((w, i) =>
        i === expIndex
          ? { ...w, achievements: [...w.achievements, "New achievement"] }
          : w
      ),
    }),

  removeAchievement: (expIndex, achIndex) =>
    set({
      work_experience: get().work_experience.map((w, i) =>
        i === expIndex
          ? {
              ...w,
              achievements: w.achievements.filter((_, j) => j !== achIndex),
            }
          : w
      ),
    }),

  moveAchievement: (expIndex, achIndex, dir) =>
    set({
      work_experience: get().work_experience.map((w, i) =>
        i === expIndex
          ? { ...w, achievements: swap(w.achievements, achIndex, dir) }
          : w
      ),
    }),
}))
```

Note: seeding via `structuredClone(data)` keeps the imported JSON module immutable even though actions produce new arrays/objects.

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun run test src/state/useStore.test.ts`
Expected: PASS — existing 3 tests + 7 new tests.

- [ ] **Step 6: Run the full suite (guard the public page)**

Run: `bun run test`
Expected: PASS — all files green (the store still exposes every `Data` field).

- [ ] **Step 7: Commit**

```bash
git add src/types/global.d.ts src/state/useStore.ts src/state/useStore.test.ts
git commit -m "$(cat <<'EOF'
CJR: add edit actions to `useStore`

- extend store type to `ResumeStore` (`Data` + `ResumeActions`)
- add `loadData`, `setPath`, and work/achievement add/remove/move actions
- seed via `structuredClone` so imported `resume.json` stays immutable
EOF
)"
```

---

### Task 3: `useVariations` persisted store

**Files:**

- Modify: `src/types/global.d.ts` (append `Variation`)
- Create: `src/state/useVariations.ts`
- Test: `src/state/useVariations.test.ts`

**Interfaces:**

- Produces: `useVariations` with state `{ variations: Variation[]; activeId: string | null }` and actions:
  - `createVariation(name: string, data: Data): string` — pushes a new `Variation` (id via `crypto.randomUUID()`, `createdAt`/`updatedAt` via `Date.now()`, `data` deep-cloned), sets `activeId` to the new id, returns the id.
  - `renameVariation(id, name)`, `deleteVariation(id)` (if the deleted one was active, `activeId` → `null`), `selectVariation(id: string | null)`, `saveActive(data: Data)` (writes cloned `data` + bumps `updatedAt` on the active variation; no-op if `activeId` is null).
- Persists `{ variations, activeId }` to `localStorage` key `resume-variations`.

- [ ] **Step 1: Add the ambient type**

Append to `src/types/global.d.ts`:

```ts
type Variation = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  data: Data
}
```

- [ ] **Step 2: Write the failing test**

```ts
// src/state/useVariations.test.ts
import { beforeEach, describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { useVariations } from "@state/useVariations"

const base = () => structuredClone(resume) as Data

beforeEach(() => {
  localStorage.clear()
  useVariations.setState({ variations: [], activeId: null })
})

describe("useVariations", () => {
  it("creates a variation and makes it active", () => {
    const id = useVariations.getState().createVariation("Globe", base())
    const state = useVariations.getState()
    expect(state.variations).toHaveLength(1)
    expect(state.variations[0].name).toBe("Globe")
    expect(state.activeId).toBe(id)
  })

  it("deep-clones the data it is given", () => {
    const data = base()
    useVariations.getState().createVariation("X", data)
    data.name = "Mutated After Create"
    expect(useVariations.getState().variations[0].data.name).toBe(resume.name)
  })

  it("renames a variation", () => {
    const id = useVariations.getState().createVariation("Old", base())
    useVariations.getState().renameVariation(id, "New")
    expect(useVariations.getState().variations[0].name).toBe("New")
  })

  it("deletes a variation and clears activeId when it was active", () => {
    const id = useVariations.getState().createVariation("X", base())
    useVariations.getState().deleteVariation(id)
    expect(useVariations.getState().variations).toHaveLength(0)
    expect(useVariations.getState().activeId).toBeNull()
  })

  it("saveActive writes new data into the active variation", () => {
    const id = useVariations.getState().createVariation("X", base())
    const edited = { ...base(), summary: "Edited summary" }
    useVariations.getState().saveActive(edited)
    const v = useVariations.getState().variations.find((x) => x.id === id)!
    expect(v.data.summary).toBe("Edited summary")
  })

  it("persists to localStorage under resume-variations", () => {
    useVariations.getState().createVariation("Persisted", base())
    expect(localStorage.getItem("resume-variations")).toContain("Persisted")
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun run test src/state/useVariations.test.ts`
Expected: FAIL — cannot find module `@state/useVariations`.

- [ ] **Step 4: Implement the store**

```ts
// src/state/useVariations.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

type VariationsState = {
  variations: Variation[]
  activeId: string | null
  createVariation: (name: string, data: Data) => string
  renameVariation: (id: string, name: string) => void
  deleteVariation: (id: string) => void
  selectVariation: (id: string | null) => void
  saveActive: (data: Data) => void
}

export const useVariations = create<VariationsState>()(
  persist(
    (set, get) => ({
      variations: [],
      activeId: null,

      createVariation: (name, data) => {
        const id = crypto.randomUUID()
        const now = Date.now()
        const variation: Variation = {
          id,
          name,
          createdAt: now,
          updatedAt: now,
          data: structuredClone(data),
        }
        set({ variations: [...get().variations, variation], activeId: id })
        return id
      },

      renameVariation: (id, name) =>
        set({
          variations: get().variations.map((v) =>
            v.id === id ? { ...v, name } : v
          ),
        }),

      deleteVariation: (id) =>
        set({
          variations: get().variations.filter((v) => v.id !== id),
          activeId: get().activeId === id ? null : get().activeId,
        }),

      selectVariation: (id) => set({ activeId: id }),

      saveActive: (data) => {
        const { activeId } = get()
        if (!activeId) return
        set({
          variations: get().variations.map((v) =>
            v.id === activeId
              ? { ...v, data: structuredClone(data), updatedAt: Date.now() }
              : v
          ),
        })
      },
    }),
    {
      name: "resume-variations",
      partialize: (state) => ({
        variations: state.variations,
        activeId: state.activeId,
      }),
    }
  )
)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test src/state/useVariations.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add src/types/global.d.ts src/state/useVariations.ts src/state/useVariations.test.ts
git commit -m "$(cat <<'EOF'
CJR: add persisted `useVariations` store

- `Variation` type and CRUD: create/rename/delete/select/saveActive
- deep-clone data in and out so variations stay isolated
- persist `variations` + `activeId` to `localStorage` key `resume-variations`
EOF
)"
```

---

### Task 4: `EditContext` (`EditProvider` + `useEditing`)

**Files:**

- Create: `src/edit/EditContext.tsx`
- Test: `src/edit/EditContext.test.tsx`

**Interfaces:**

- Produces: `EditProvider({ editing, markDirty, children })`, `useEditing(): { editing: boolean; markDirty: () => void }`. Default outside any provider is `{ editing: false, markDirty: () => {} }` — so existing components render in view mode with no provider.

Add the `@edit/*` alias now (used by every later task): see Task 13 for the matching `tsconfig.json`/`vite.config.ts` edits — **do those first if `@edit/*` does not yet resolve.** (Implementer note: if running tasks in order, apply the two alias lines from Task 13 Step 1 here so imports resolve; the rest of Task 13 stays for later.)

- [ ] **Step 1: Write the failing test**

```tsx
// src/edit/EditContext.test.tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { EditProvider, useEditing } from "@edit/EditContext"

function Probe() {
  const { editing } = useEditing()
  return <span>{editing ? "editing" : "viewing"}</span>
}

describe("EditContext", () => {
  it("defaults to not editing with no provider", () => {
    render(<Probe />)
    expect(screen.getByText("viewing")).toBeInTheDocument()
  })

  it("reflects the provider's editing flag", () => {
    render(
      <EditProvider editing markDirty={() => {}}>
        <Probe />
      </EditProvider>
    )
    expect(screen.getByText("editing")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/edit/EditContext.test.tsx`
Expected: FAIL — cannot find module `@edit/EditContext`.

- [ ] **Step 3: Implement**

```tsx
// src/edit/EditContext.tsx
import { createContext, useContext } from "react"
import type { ReactNode } from "react"

type EditContextValue = {
  editing: boolean
  markDirty: () => void
}

const EditContext = createContext<EditContextValue>({
  editing: false,
  markDirty: () => {},
})

export function EditProvider({
  editing,
  markDirty,
  children,
}: {
  editing: boolean
  markDirty: () => void
  children: ReactNode
}) {
  return (
    <EditContext.Provider value={{ editing, markDirty }}>
      {children}
    </EditContext.Provider>
  )
}

export function useEditing(): EditContextValue {
  return useContext(EditContext)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/edit/EditContext.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/edit/EditContext.tsx src/edit/EditContext.test.tsx
git commit -m "$(cat <<'EOF'
CJR: add `EditContext` provider and `useEditing` hook

- exposes `{ editing, markDirty }`, defaults to view mode with no provider
- lets shared resume components stay view-only on the public page
EOF
)"
```

---

### Task 5: `EditableText` inline field

**Files:**

- Create: `src/edit/EditableText.tsx`, `src/edit/EditableText.module.css`
- Test: `src/edit/EditableText.test.tsx`

**Interfaces:**

- Consumes: `useEditing` (Task 4), `useStore` (Task 2).
- Produces: `EditableText({ value, path, multiline?, ariaLabel? })`. View mode (`editing === false`): returns the raw `value` string (no wrapper element). Edit mode: a single-line `<input>` (or auto-growing `<textarea>` when `multiline`) with `className={styles.field}`, `value={value}`, and `onChange` → `useStore.getState().setPath(path, e.target.value)` then `markDirty()`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/edit/EditableText.test.tsx
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { EditProvider } from "@edit/EditContext"
import { EditableText } from "@edit/EditableText"

import { useStore } from "@state/useStore"

beforeEach(() => {
  useStore.getState().loadData(structuredClone(resume) as Data)
})

describe("EditableText", () => {
  it("renders plain text in view mode with no input", () => {
    render(<EditableText value="Hello" path={["name"]} />)
    expect(screen.getByText("Hello")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("renders an input in edit mode", () => {
    render(
      <EditProvider editing markDirty={() => {}}>
        <EditableText value="Hello" path={["name"]} ariaLabel="Name" />
      </EditProvider>
    )
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Hello")
  })

  it("commits edits through setPath and calls markDirty", () => {
    let dirty = 0
    render(
      <EditProvider editing markDirty={() => (dirty += 1)}>
        <EditableText
          value={useStore.getState().name}
          path={["name"]}
          ariaLabel="Name"
        />
      </EditProvider>
    )
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Changed" },
    })
    expect(useStore.getState().name).toBe("Changed")
    expect(dirty).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/edit/EditableText.test.tsx`
Expected: FAIL — cannot find module `@edit/EditableText`.

- [ ] **Step 3: Implement the component**

```tsx
// src/edit/EditableText.tsx
import { useLayoutEffect, useRef } from "react"

import { useEditing } from "@edit/EditContext"
import styles from "@edit/EditableText.module.css"

import { useStore } from "@state/useStore"

export function EditableText({
  value,
  path,
  multiline = false,
  ariaLabel,
}: {
  value: string
  path: PathKey[]
  multiline?: boolean
  ariaLabel?: string
}) {
  const { editing, markDirty } = useEditing()
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    if (multiline && ref.current) {
      ref.current.style.height = "auto"
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  })

  if (!editing) return <>{value}</>

  const commit = (next: string) => {
    useStore.getState().setPath(path, next)
    markDirty()
  }

  if (multiline) {
    return (
      <textarea
        ref={ref}
        className={styles.field}
        value={value}
        aria-label={ariaLabel}
        rows={1}
        onChange={(e) => commit(e.target.value)}
      />
    )
  }

  return (
    <input
      className={styles.field}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => commit(e.target.value)}
    />
  )
}
```

- [ ] **Step 4: Add the CSS module**

```css
/* src/edit/EditableText.module.css */
.field {
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  width: 100%;
  background: transparent;
  border: 1px dashed transparent;
  border-radius: 4px;
  padding: 1px 4px;
  resize: none;
  overflow: hidden;
}

.field:hover {
  border-color: var(--border);
  background: color-mix(in srgb, var(--panel) 60%, transparent);
}

.field:focus {
  outline: none;
  border-color: var(--accent);
  background: var(--panel);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test src/edit/EditableText.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/edit/EditableText.tsx src/edit/EditableText.module.css src/edit/EditableText.test.tsx
git commit -m "$(cat <<'EOF'
CJR: add inline `EditableText` field

- view mode renders the raw string; edit mode renders input/textarea
- commits through `useStore.setPath` and flags the page dirty
- auto-grows the textarea and inherits surrounding typography
EOF
)"
```

---

### Task 6: Wire `EditableText` into `Summary` and `TechnicalSkills`

**Files:**

- Modify: `src/components/Summary.tsx`, `src/components/TechnicalSkills.tsx`
- Test: existing `src/components/Summary.test.tsx`, `src/components/TechnicalSkills.test.tsx` (must stay green; no new tests required — the invariant is that view-mode DOM is unchanged)

**Interfaces:**

- Consumes: `EditableText` (Task 5).

- [ ] **Step 1: Edit `Summary.tsx`**

```tsx
import { Section } from "@components/Section"

import { EditableText } from "@edit/EditableText"

import { useStore } from "@state/useStore"

export function Summary() {
  const { summary } = useStore()

  return (
    <Section title="Summary">
      <p>
        <EditableText
          value={summary}
          path={["summary"]}
          multiline
          ariaLabel="Summary"
        />
      </p>
    </Section>
  )
}
```

- [ ] **Step 2: Edit `TechnicalSkills.tsx`**

Change the `key={s}` to a stable index key (prevents input remount-on-type in edit mode) and wrap the skill text:

```tsx
{
  technical_skills.map((s, i) => {
    const description = skillDescriptions[s] ?? fallbackDescription
    return (
      <li
        key={i}
        className={styles.pill}
        aria-label={`${s}: ${description}`}
        onMouseEnter={(e) => clampTooltipToViewport(e.currentTarget)}
        onFocus={(e) => clampTooltipToViewport(e.currentTarget)}
      >
        <EditableText
          value={s}
          path={["technical_skills", i]}
          ariaLabel={`Skill ${i + 1}`}
        />
        <span data-skill-tooltip role="tooltip" className={styles.tooltip}>
          {description}
        </span>
      </li>
    )
  })
}
```

Add `import { EditableText } from "@edit/EditableText"` to the import block (after the `@components` group, before `@state`, per import-order rules — run `bun prettier` if unsure).

- [ ] **Step 3: Run the affected tests**

Run: `bun run test src/components/Summary.test.tsx src/components/TechnicalSkills.test.tsx`
Expected: PASS — view-mode text is unchanged.

- [ ] **Step 4: Run the full suite**

Run: `bun run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Summary.tsx src/components/TechnicalSkills.tsx
git commit -m "$(cat <<'EOF'
CJR: make `Summary` and `TechnicalSkills` text editable

- wrap summary and each skill pill label in `EditableText`
- key skills by index so edit-mode inputs do not remount on keystroke
EOF
)"
```

---

### Task 7: Wire `EditableText` into `Awards`, `Languages`, `Education`

**Files:**

- Modify: `src/components/Awards.tsx`, `src/components/Languages.tsx`, `src/components/Education.tsx`
- Test: existing component tests must stay green.

**Interfaces:**

- Consumes: `EditableText` (Task 5).

Award `year` (a number) stays plain text to avoid number/string drift; `name` and `organization` become editable.

- [ ] **Step 1: Edit `Awards.tsx`**

```tsx
import { Section } from "@components/Section"

import { EditableText } from "@edit/EditableText"

import { useStore } from "@state/useStore"

export function Awards({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { awards } = useStore()

  return (
    <Section title="Awards" index={index} eyebrow={eyebrow}>
      <ul>
        {awards.map((a, i) => (
          <li key={i}>
            <strong>
              <EditableText
                value={a.name}
                path={["awards", i, "name"]}
                ariaLabel={`Award ${i + 1} name`}
              />
            </strong>{" "}
            —{" "}
            <EditableText
              value={a.organization}
              path={["awards", i, "organization"]}
              ariaLabel={`Award ${i + 1} organization`}
            />{" "}
            ({a.year})
          </li>
        ))}
      </ul>
    </Section>
  )
}
```

- [ ] **Step 2: Edit `Languages.tsx`**

```tsx
import { Section } from "@components/Section"

import { EditableText } from "@edit/EditableText"

import { useStore } from "@state/useStore"

export function Languages({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { languages } = useStore()

  return (
    <Section title="Languages" index={index} eyebrow={eyebrow}>
      <ul>
        {languages.map((l, i) => (
          <li key={i}>
            <strong>
              <EditableText
                value={l.name}
                path={["languages", i, "name"]}
                ariaLabel={`Language ${i + 1} name`}
              />
              :
            </strong>{" "}
            <EditableText
              value={l.proficiency}
              path={["languages", i, "proficiency"]}
              ariaLabel={`Language ${i + 1} proficiency`}
            />
          </li>
        ))}
      </ul>
    </Section>
  )
}
```

- [ ] **Step 3: Edit `Education.tsx`**

The `details` field is optional. Keep it text-only and render `EditableText` for `program` and `institution`; leave the `details` suffix exactly as today (it is rarely present and not in the base data).

```tsx
import { Section } from "@components/Section"

import { EditableText } from "@edit/EditableText"

import { useStore } from "@state/useStore"

export function Education({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { education } = useStore()

  return (
    <Section title="Education" index={index} eyebrow={eyebrow}>
      <ul>
        {education.map((e, i) => (
          <li key={i}>
            <strong>
              <EditableText
                value={e.program}
                path={["education", i, "program"]}
                ariaLabel={`Education ${i + 1} program`}
              />
            </strong>{" "}
            —{" "}
            <EditableText
              value={e.institution}
              path={["education", i, "institution"]}
              ariaLabel={`Education ${i + 1} institution`}
            />
            {e.details ? ` — ${e.details}` : ""}
          </li>
        ))}
      </ul>
    </Section>
  )
}
```

- [ ] **Step 4: Run the affected tests**

Run: `bun run test src/components/Awards.test.tsx src/components/Languages.test.tsx src/components/Education.test.tsx`
Expected: PASS — view-mode text content unchanged.

If any test fails because text is split across the inline `EditableText` and adjacent literal text (e.g. a matcher expects an exact single text node), update the matcher to a function/`{ exact: false }` form that matches the combined content — but do **not** change the rendered output. Re-run until green.

- [ ] **Step 5: Run the full suite**

Run: `bun run test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Awards.tsx src/components/Languages.tsx src/components/Education.tsx
git commit -m "$(cat <<'EOF'
CJR: make `Awards`, `Languages`, `Education` text editable

- wrap name/organization, name/proficiency, program/institution in `EditableText`
- key list items by index for stable edit-mode inputs
- leave award `year` and education `details` as plain text
EOF
)"
```

---

### Task 8: Wire `EditableText` into `Header` (identity + contact)

**Files:**

- Modify: `src/components/Header.tsx`
- Test: existing `src/components/Header.test.tsx` must stay green.

**Interfaces:**

- Consumes: `EditableText` (Task 5), `useEditing` (Task 4).

`name` and `title` are not inside anchors, so they take inline `EditableText` in both modes. The contact row wraps text in `<a>` elements; to avoid inputs nested in links, render an editable contact block (plain `EditableText`, no anchors) when `editing`, and keep the existing anchor block verbatim when not. View-mode DOM is therefore unchanged.

- [ ] **Step 1: Edit `Header.tsx`**

Add imports `import { EditableText } from "@edit/EditableText"` and `import { useEditing } from "@edit/EditContext"`. Replace the component body:

```tsx
export function Header() {
  const { name, title, contact } = useStore()
  const { editing } = useEditing()

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <img src={Logo} alt="Logo" className={styles.logo} />
        <div>
          <h1>
            <EditableText value={name} path={["name"]} ariaLabel="Name" />
          </h1>
          <p className={styles.subtitle}>
            <EditableText value={title} path={["title"]} ariaLabel="Title" />
          </p>
        </div>
      </div>
      {editing ? (
        <div className={styles.contact}>
          <EditableText
            value={contact.email}
            path={["contact", "email"]}
            ariaLabel="Email"
          />
          <EditableText
            value={contact.phone}
            path={["contact", "phone"]}
            ariaLabel="Phone"
          />
          <EditableText
            value={contact.location}
            path={["contact", "location"]}
            ariaLabel="Location"
          />
          <EditableText
            value={contact.github}
            path={["contact", "github"]}
            ariaLabel="GitHub URL"
          />
          <EditableText
            value={contact.linkedin}
            path={["contact", "linkedin"]}
            ariaLabel="LinkedIn URL"
          />
        </div>
      ) : (
        <div className={styles.contact}>
          <a href={`mailto:${contact.email}`}>
            <EmailIcon />
            <span className={styles.label}>{contact.email}</span>
          </a>
          <span className={styles.sep}>•</span>
          <a href={`tel:${contact.phone}`}>
            <PhoneIcon />
            <span className={styles.label}>{contact.phone}</span>
          </a>
          <span className={styles.sep}>•</span>
          <span className={styles.location}>{contact.location}</span>
          <span className={styles.sep}>•</span>
          <a href={contact.github} target="_blank" rel="noopener noreferrer">
            <GitHubIcon />
            <span className={styles.label}>GitHub</span>
          </a>
          <span className={styles.sep}>•</span>
          <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
            <LinkedInIcon />
            <span className={styles.label}>LinkedIn</span>
          </a>
        </div>
      )}
    </header>
  )
}
```

- [ ] **Step 2: Run the Header test**

Run: `bun run test src/components/Header.test.tsx`
Expected: PASS — the non-editing branch is byte-identical to the original; `name`/`title` view-mode output is the raw string.

- [ ] **Step 3: Run the full suite**

Run: `bun run test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.tsx
git commit -m "$(cat <<'EOF'
CJR: make `Header` identity and contact editable

- wrap `name` and `title` in `EditableText` (inline, both modes)
- render a plain editable contact block in edit mode to avoid inputs in links
- keep the anchor contact block verbatim in view mode
EOF
)"
```

---

### Task 9: Wire `EditableText` into `Showcase`

**Files:**

- Modify: `src/components/Showcase.tsx`
- Test: existing `src/components/Showcase.test.tsx` must stay green.

**Interfaces:**

- Consumes: `EditableText` (Task 5), `useEditing` (Task 4).

Each card is an `<a href>`. In edit mode, render the card body as a `<div>` (no anchor, no nested inputs-in-link) with editable `domain`, `name`, `period`, `role`, `description`; tags stay plain text. In view mode, keep the existing `<a>` card verbatim.

- [ ] **Step 1: Edit `Showcase.tsx`**

Add `import { useEditing } from "@edit/EditContext"` and `import { EditableText } from "@edit/EditableText"`. Replace the body:

```tsx
export function Showcase({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { showcase } = useStore()
  const { editing } = useEditing()

  return (
    <Section title="Selected Work" index={index} eyebrow={eyebrow}>
      <ul className={styles.grid}>
        {showcase.map((item, i) =>
          editing ? (
            <li key={i}>
              <div className={styles.card}>
                <span className={styles.frame} aria-hidden>
                  <span className={styles.dots}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                  </span>
                  <span className={styles.domain}>
                    <EditableText
                      value={item.domain}
                      path={["showcase", i, "domain"]}
                      ariaLabel={`Showcase ${i + 1} domain`}
                    />
                  </span>
                </span>
                <span className={styles.shot}>
                  <img src={item.image} alt={`${item.name} website`} />
                </span>
                <span className={styles.body}>
                  <span className={styles.titleRow}>
                    <h3 className={styles.name}>
                      <EditableText
                        value={item.name}
                        path={["showcase", i, "name"]}
                        ariaLabel={`Showcase ${i + 1} name`}
                      />
                    </h3>
                    <span className={styles.period}>
                      <EditableText
                        value={item.period}
                        path={["showcase", i, "period"]}
                        ariaLabel={`Showcase ${i + 1} period`}
                      />
                    </span>
                  </span>
                  <span className={styles.role}>
                    <EditableText
                      value={item.role}
                      path={["showcase", i, "role"]}
                      ariaLabel={`Showcase ${i + 1} role`}
                    />
                  </span>
                  <span className={styles.description}>
                    <EditableText
                      value={item.description}
                      path={["showcase", i, "description"]}
                      multiline
                      ariaLabel={`Showcase ${i + 1} description`}
                    />
                  </span>
                  <span className={styles.tags}>
                    {item.tags.map((tag, t) => (
                      <span key={t} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </span>
                </span>
              </div>
            </li>
          ) : (
            <li key={item.url}>
              <a
                className={styles.card}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.frame} aria-hidden>
                  <span className={styles.dots}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                  </span>
                  <span className={styles.domain}>{item.domain}</span>
                </span>
                <span className={styles.shot}>
                  <img
                    src={item.image}
                    alt={`${item.name} website`}
                    loading="lazy"
                  />
                </span>
                <span className={styles.body}>
                  <span className={styles.titleRow}>
                    <h3 className={styles.name}>{item.name}</h3>
                    <span className={styles.period}>{item.period}</span>
                  </span>
                  <span className={styles.role}>{item.role}</span>
                  <span className={styles.description}>{item.description}</span>
                  <span className={styles.tags}>
                    {item.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </span>
                </span>
              </a>
            </li>
          )
        )}
      </ul>
    </Section>
  )
}
```

- [ ] **Step 2: Run the Showcase test**

Run: `bun run test src/components/Showcase.test.tsx`
Expected: PASS — the view-mode (`editing === false`) branch is byte-identical to the original (links, `loading="lazy"`, keys).

- [ ] **Step 3: Run the full suite**

Run: `bun run test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/Showcase.tsx
git commit -m "$(cat <<'EOF'
CJR: make `Showcase` cards editable in edit mode

- render a non-anchor card with `EditableText` fields when editing
- keep the linked card verbatim in view mode
- leave tags and the screenshot image as-is
EOF
)"
```

---

### Task 10: `WorkExperience` text editing + structural CRUD

**Files:**

- Modify: `src/components/WorkExperience.tsx`, `src/components/WorkExperience.module.css`
- Test: existing `src/components/WorkExperience.test.tsx` must stay green; add edit-mode tests in the same file.

**Interfaces:**

- Consumes: `EditableText` (Task 5), `useEditing` (Task 4), `useStore` actions (Task 2).

In view mode the markup is unchanged except list keys become index-based and text is wrapped in `EditableText` (which renders raw strings). In edit mode, an editing toolbar of small buttons appears per experience (move up `↑`, move down `↓`, remove `✕`, plus add-bullet and per-bullet move/remove, and an "Add experience" button at the end). These controls render only when `editing`.

- [ ] **Step 1: Write edit-mode tests**

Append to `src/components/WorkExperience.test.tsx` (add `fireEvent` to the testing-library import, and `import { EditProvider } from "@edit/EditContext"`, `import { useStore } from "@state/useStore"`):

```tsx
describe("WorkExperience editing", () => {
  beforeEach(() => {
    useStore.getState().loadData(structuredClone(resume) as Data)
  })

  function renderEditing() {
    return render(
      <EditProvider editing markDirty={() => {}}>
        <WorkExperience />
      </EditProvider>
    )
  }

  it("adds an experience when Add experience is clicked", () => {
    renderEditing()
    const before = useStore.getState().work_experience.length
    fireEvent.click(screen.getByRole("button", { name: /add experience/i }))
    expect(useStore.getState().work_experience.length).toBe(before + 1)
  })

  it("removes the first experience", () => {
    renderEditing()
    const second = useStore.getState().work_experience[1].company
    fireEvent.click(
      screen.getAllByRole("button", { name: /remove experience/i })[0]
    )
    expect(useStore.getState().work_experience[0].company).toBe(second)
  })

  it("adds a bullet to the first experience", () => {
    renderEditing()
    const before = useStore.getState().work_experience[0].achievements.length
    fireEvent.click(
      screen.getAllByRole("button", { name: /add achievement/i })[0]
    )
    expect(useStore.getState().work_experience[0].achievements.length).toBe(
      before + 1
    )
  })
})
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run: `bun run test src/components/WorkExperience.test.tsx`
Expected: FAIL — no "Add experience" button yet.

- [ ] **Step 3: Implement the component**

```tsx
import { Section } from "@components/Section"
import styles from "@components/WorkExperience.module.css"

import { useEditing } from "@edit/EditContext"
import { EditableText } from "@edit/EditableText"

import { useStore } from "@state/useStore"

export function WorkExperience({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { work_experience } = useStore()
  const { editing, markDirty } = useEditing()
  const store = useStore.getState()

  const act = (fn: () => void) => () => {
    fn()
    markDirty()
  }

  return (
    <Section title="Work Experience" index={index} eyebrow={eyebrow}>
      <ul className={styles.timeline}>
        {work_experience.map((w, wi) => (
          <li key={wi}>
            <div className={styles.item}>
              <div className={styles.header}>
                <div>
                  <h3>
                    <EditableText
                      value={w.role}
                      path={["work_experience", wi, "role"]}
                      ariaLabel={`Role ${wi + 1}`}
                    />
                  </h3>
                  <p className={styles.muted}>
                    <EditableText
                      value={w.company}
                      path={["work_experience", wi, "company"]}
                      ariaLabel={`Company ${wi + 1}`}
                    />
                  </p>
                </div>
                <span className={styles.period}>
                  <EditableText
                    value={w.period}
                    path={["work_experience", wi, "period"]}
                    ariaLabel={`Period ${wi + 1}`}
                  />
                </span>
              </div>

              {editing && (
                <div className={styles.rowControls}>
                  <button
                    type="button"
                    aria-label={`Move experience ${wi + 1} up`}
                    onClick={act(() => store.moveExperience(wi, -1))}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move experience ${wi + 1} down`}
                    onClick={act(() => store.moveExperience(wi, 1))}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove experience ${wi + 1}`}
                    onClick={act(() => store.removeExperience(wi))}
                  >
                    ✕
                  </button>
                </div>
              )}

              <ul className={styles.bullets}>
                {w.achievements.map((a, ai) => (
                  <li key={ai}>
                    <EditableText
                      value={a}
                      path={["work_experience", wi, "achievements", ai]}
                      multiline
                      ariaLabel={`Achievement ${wi + 1}.${ai + 1}`}
                    />
                    {editing && (
                      <span className={styles.rowControls}>
                        <button
                          type="button"
                          aria-label={`Move achievement ${wi + 1}.${ai + 1} up`}
                          onClick={act(() => store.moveAchievement(wi, ai, -1))}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`Move achievement ${wi + 1}.${ai + 1} down`}
                          onClick={act(() => store.moveAchievement(wi, ai, 1))}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove achievement ${wi + 1}.${ai + 1}`}
                          onClick={act(() => store.removeAchievement(wi, ai))}
                        >
                          ✕
                        </button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {editing && (
                <button
                  type="button"
                  className={styles.addButton}
                  aria-label={`Add achievement to experience ${wi + 1}`}
                  onClick={act(() => store.addAchievement(wi))}
                >
                  + Add achievement
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <button
          type="button"
          className={styles.addButton}
          onClick={act(() => store.addExperience())}
        >
          + Add experience
        </button>
      )}
    </Section>
  )
}
```

- [ ] **Step 4: Add edit-control styles**

Append to `src/components/WorkExperience.module.css`:

```css
.rowControls {
  display: inline-grid;
  grid-auto-flow: column;
  gap: 4px;
  align-items: center;
}

.rowControls button {
  font: inherit;
  line-height: 1;
  padding: 2px 6px;
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
}

.rowControls button:hover {
  border-color: var(--accent);
}

.addButton {
  justify-self: start;
  font: inherit;
  padding: 4px 10px;
  background: transparent;
  color: var(--accent);
  border: 1px dashed var(--border);
  border-radius: 6px;
  cursor: pointer;
}

.addButton:hover {
  border-color: var(--accent);
}
```

If the bullets `<li>` needs to lay out text + controls on one row, confirm `.bullets li` tolerates the inline control span; if spacing looks cramped, set `.bullets li { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: start; }` (grid + gap, no margins).

- [ ] **Step 5: Run the tests**

Run: `bun run test src/components/WorkExperience.test.tsx`
Expected: PASS — original 4 tests (view mode unchanged) + 3 edit tests.

- [ ] **Step 6: Run the full suite**

Run: `bun run test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/WorkExperience.tsx src/components/WorkExperience.module.css src/components/WorkExperience.test.tsx
git commit -m "$(cat <<'EOF'
CJR: add editing and CRUD to `WorkExperience`

- wrap role/company/period/achievement text in `EditableText`
- add edit-mode controls: move/remove experience, move/remove/add bullet
- add experience button; controls render only when `editing`
EOF
)"
```

---

### Task 11: `VariationsPanel` sidebar

**Files:**

- Create: `src/edit/VariationsPanel.tsx`, `src/edit/VariationsPanel.module.css`
- Test: `src/edit/VariationsPanel.test.tsx`

**Interfaces:**

- Consumes: `useVariations` (Task 3).
- Produces: `VariationsPanel({ dirty, onSave, onGenerate, onNew })`. Renders a "Base (original)" entry (selecting it calls `selectVariation(null)`), each saved variation as a button (selecting calls `selectVariation(id)`) with inline rename (✎ → prompt) and delete (✕ → `deleteVariation`), a "＋ New" button calling `onNew`, and footer **Save** (calls `onSave`, disabled when `activeId === null` or `!dirty`) + **Generate PDF** (calls `onGenerate`). Active entry gets `aria-current="true"`. A dirty dot shows when `dirty`.

Rename and New use `window.prompt` (simple, no modal dependency); guard against empty/cancelled input.

- [ ] **Step 1: Write the failing test**

```tsx
// src/edit/VariationsPanel.test.tsx
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { VariationsPanel } from "@edit/VariationsPanel"

import { useVariations } from "@state/useVariations"

beforeEach(() => {
  localStorage.clear()
  useVariations.setState({ variations: [], activeId: null })
})

const noop = () => {}

describe("VariationsPanel", () => {
  it("always shows a Base entry", () => {
    render(
      <VariationsPanel
        dirty={false}
        onSave={noop}
        onGenerate={noop}
        onNew={noop}
      />
    )
    expect(screen.getByRole("button", { name: /base/i })).toBeInTheDocument()
  })

  it("lists saved variations", () => {
    useVariations.setState({
      variations: [
        {
          id: "1",
          name: "Globe",
          createdAt: 0,
          updatedAt: 0,
          data: {} as Data,
        },
      ],
      activeId: "1",
    })
    render(
      <VariationsPanel
        dirty={false}
        onSave={noop}
        onGenerate={noop}
        onNew={noop}
      />
    )
    expect(screen.getByRole("button", { name: /globe/i })).toBeInTheDocument()
  })

  it("calls onNew when New is clicked", () => {
    const onNew = vi.fn()
    render(
      <VariationsPanel
        dirty={false}
        onSave={noop}
        onGenerate={noop}
        onNew={onNew}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /new/i }))
    expect(onNew).toHaveBeenCalledOnce()
  })

  it("disables Save on Base", () => {
    render(
      <VariationsPanel dirty onSave={noop} onGenerate={noop} onNew={noop} />
    )
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/edit/VariationsPanel.test.tsx`
Expected: FAIL — cannot find module `@edit/VariationsPanel`.

- [ ] **Step 3: Implement the component**

```tsx
// src/edit/VariationsPanel.tsx
import styles from "@edit/VariationsPanel.module.css"

import { useVariations } from "@state/useVariations"

export function VariationsPanel({
  dirty,
  onSave,
  onGenerate,
  onNew,
}: {
  dirty: boolean
  onSave: () => void
  onGenerate: () => void
  onNew: () => void
}) {
  const {
    variations,
    activeId,
    selectVariation,
    renameVariation,
    deleteVariation,
  } = useVariations()

  const onBase = activeId === null

  const rename = (id: string, current: string) => {
    const next = window.prompt("Rename variation", current)?.trim()
    if (next) renameVariation(id, next)
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.heading}>
        <span>Variations</span>
        <button type="button" className={styles.new} onClick={onNew}>
          ＋ New
        </button>
      </div>

      <ul className={styles.list}>
        <li>
          <button
            type="button"
            className={styles.entry}
            aria-current={onBase}
            onClick={() => selectVariation(null)}
          >
            Base (original)
          </button>
        </li>
        {variations.map((v) => (
          <li key={v.id} className={styles.row}>
            <button
              type="button"
              className={styles.entry}
              aria-current={activeId === v.id}
              onClick={() => selectVariation(v.id)}
            >
              {v.name}
            </button>
            <button
              type="button"
              aria-label={`Rename ${v.name}`}
              onClick={() => rename(v.id, v.name)}
            >
              ✎
            </button>
            <button
              type="button"
              aria-label={`Delete ${v.name}`}
              onClick={() => deleteVariation(v.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <button type="button" onClick={onSave} disabled={onBase || !dirty}>
          Save{dirty && !onBase ? " •" : ""}
        </button>
        <button type="button" onClick={onGenerate}>
          Generate PDF
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Add the CSS module**

```css
/* src/edit/VariationsPanel.module.css */
.panel {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
  padding: 16px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  height: fit-content;
  position: sticky;
  top: 16px;
}

.heading {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  color: var(--muted);
}

.list {
  display: grid;
  gap: 6px;
  list-style: none;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 4px;
  align-items: center;
}

.entry {
  font: inherit;
  text-align: left;
  padding: 6px 8px;
  width: 100%;
  background: transparent;
  color: var(--text);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
}

.entry[aria-current="true"] {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}

.row button:not(.entry),
.new {
  font: inherit;
  padding: 4px 8px;
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
}

.footer {
  display: grid;
  gap: 8px;
}

.footer button {
  font: inherit;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--accent);
  color: var(--bg);
  cursor: pointer;
}

.footer button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test src/edit/VariationsPanel.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/edit/VariationsPanel.tsx src/edit/VariationsPanel.module.css src/edit/VariationsPanel.test.tsx
git commit -m "$(cat <<'EOF'
CJR: add `VariationsPanel` sidebar

- Base entry plus saved variations with inline rename/delete
- New, Save (disabled on Base / when clean), and Generate PDF actions
- sticky panel styled with grid + gap and theme tokens
EOF
)"
```

---

### Task 12: `EditResumeApp` root (compose, dirty, save, generate)

**Files:**

- Create: `src/edit/EditResumeApp.tsx`, `src/edit/EditResumeApp.module.css`
- Test: `src/edit/EditResumeApp.test.tsx`

**Interfaces:**

- Consumes: `useStore` (Task 2), `useVariations` (Task 3), `EditProvider` (Task 4), `VariationsPanel` (Task 11), all section components, `@app/App.module.css`, `@data/resume.json`, dynamic `@pdf`.
- Produces: default-exported `EditResumeApp`. Loads the active variation (or `resume.json` for Base) into `useStore` on mount and whenever `activeId` changes; owns `dirty` state (set via `markDirty`, cleared on load/save); `editing = activeId !== null`; Save → `saveActive(toData(useStore.getState()))` + clear dirty; New → prompt name → `createVariation(name, toData(useStore.getState()))`; Generate → dynamic-import `@pdf`, `generateResumePdf(useStore.getState())`, `downloadBlob` with a slugified filename. A `beforeunload` listener warns while `dirty`.

`toData` strips action functions: `Object.fromEntries(Object.entries(state).filter(([, v]) => typeof v !== "function")) as Data`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/edit/EditResumeApp.test.tsx
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import EditResumeApp from "@edit/EditResumeApp"

import { useStore } from "@state/useStore"
import { useVariations } from "@state/useVariations"

beforeEach(() => {
  localStorage.clear()
  useVariations.setState({ variations: [], activeId: null })
  useStore.getState().loadData(structuredClone(resume) as Data)
})

describe("EditResumeApp", () => {
  it("renders the resume with the variations panel", () => {
    render(<EditResumeApp />)
    expect(screen.getByRole("button", { name: /base/i })).toBeInTheDocument()
    expect(
      screen.getAllByRole("heading", { level: 1, name: resume.name }).length
    ).toBeGreaterThanOrEqual(1)
  })

  it("loads a saved variation's data into the store on mount", () => {
    useVariations.setState({
      variations: [
        {
          id: "1",
          name: "X",
          createdAt: 0,
          updatedAt: 0,
          data: { ...(structuredClone(resume) as Data), name: "Variant Name" },
        },
      ],
      activeId: "1",
    })
    render(<EditResumeApp />)
    expect(useStore.getState().name).toBe("Variant Name")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/edit/EditResumeApp.test.tsx`
Expected: FAIL — cannot find module `@edit/EditResumeApp`.

- [ ] **Step 3: Implement the component**

```tsx
// src/edit/EditResumeApp.tsx
import { useCallback, useEffect, useState } from "react"

import { Awards } from "@components/Awards"
import { Education } from "@components/Education"
import { Header } from "@components/Header"
import { Languages } from "@components/Languages"
import { Showcase } from "@components/Showcase"
import { Summary } from "@components/Summary"
import { TechnicalSkills } from "@components/TechnicalSkills"
import { WorkExperience } from "@components/WorkExperience"

import resume from "@data/resume.json"

import { EditProvider } from "@edit/EditContext"
import styles from "@edit/EditResumeApp.module.css"
import { VariationsPanel } from "@edit/VariationsPanel"

import { useStore } from "@state/useStore"
import { useVariations } from "@state/useVariations"

import appStyles from "@app/App.module.css"

function toData(state: ResumeStore): Data {
  return Object.fromEntries(
    Object.entries(state).filter(([, v]) => typeof v !== "function")
  ) as Data
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "resume"
  )
}

export default function EditResumeApp() {
  const { variations, activeId, createVariation, saveActive } = useVariations()
  const [dirty, setDirty] = useState(false)

  const editing = activeId !== null

  useEffect(() => {
    const active = variations.find((v) => v.id === activeId)
    useStore.getState().loadData(active ? active.data : (resume as Data))
    setDirty(false)
  }, [activeId, variations])

  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  const markDirty = useCallback(() => setDirty(true), [])

  const onSave = useCallback(() => {
    saveActive(toData(useStore.getState()))
    setDirty(false)
  }, [saveActive])

  const onNew = useCallback(() => {
    const name = window.prompt("Name this variation")?.trim()
    if (!name) return
    createVariation(name, toData(useStore.getState()))
  }, [createVariation])

  const onGenerate = useCallback(async () => {
    const { generateResumePdf, downloadBlob } = await import("@pdf")
    const blob = await generateResumePdf(useStore.getState())
    const active = variations.find((v) => v.id === activeId)
    const filename = active
      ? `cj_rivas_${slugify(active.name)}.pdf`
      : "cj_rivas_senior_frontend_engineer.pdf"
    downloadBlob(blob, filename)
  }, [variations, activeId])

  return (
    <div className={styles.page}>
      <VariationsPanel
        dirty={dirty}
        onSave={onSave}
        onGenerate={onGenerate}
        onNew={onNew}
      />
      <EditProvider editing={editing} markDirty={markDirty}>
        <div id="resume-root" className={appStyles.resumeRoot}>
          <Header />
          <div className={appStyles.container}>
            <main className={appStyles.main}>
              <Summary />
              <TechnicalSkills index={1} eyebrow="Stack" />
              <WorkExperience index={2} eyebrow="Experience" />
              <Showcase index={3} eyebrow="Selected Work" />
              <div className={appStyles.subgrid}>
                <Awards index={4} eyebrow="Recognition" />
                <Languages index={5} eyebrow="Languages" />
                <Education index={6} eyebrow="Education" />
              </div>
            </main>
          </div>
        </div>
      </EditProvider>
    </div>
  )
}
```

- [ ] **Step 4: Add the CSS module**

```css
/* src/edit/EditResumeApp.module.css */
.page {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 24px;
  max-width: 1200px;
  padding: 24px;
  margin: 0 auto;
}

@media (max-width: 720px) {
  .page {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test src/edit/EditResumeApp.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Run the full suite**

Run: `bun run test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/edit/EditResumeApp.tsx src/edit/EditResumeApp.module.css src/edit/EditResumeApp.test.tsx
git commit -m "$(cat <<'EOF'
CJR: add `EditResumeApp` edit-page root

- load active variation (or Base `resume.json`) into `useStore` on change
- own dirty state, `beforeunload` guard, Save and New via `useVariations`
- Generate PDF from the live draft with a slugified per-variation filename
EOF
)"
```

---

### Task 13: Route branch, Netlify redirect, alias config

**Files:**

- Modify: `src/Entry.tsx`
- Create: `public/_redirects`
- Modify: `vite.config.ts` (`resolve.alias`), `tsconfig.json` (`compilerOptions.paths`)
- Test: `src/Entry.test.tsx` (new — assert the route-selection helper)

**Interfaces:**

- Consumes: `App` (default), `EditResumeApp` (Task 12).
- Produces: `Entry.tsx` mounts `EditResumeApp` when `window.location.pathname === "/edit-resume"`, else `App` (and only `App` calls `applySky()`).

If the `@edit/*` alias was already added during Task 4, keep it; this task adds it authoritatively and the `@app` non-wildcard note below.

- [ ] **Step 1: Add the `@edit/*` alias to both config files**

In `vite.config.ts`, add to `resolve.alias` (keep alphabetical grouping near `@data`):

```ts
"@edit": path.resolve(__dirname, "src/edit"),
```

Vite alias matching is prefix-based, so `@edit` covers `@edit/EditableText`. In `tsconfig.json` `compilerOptions.paths`, add:

```json
"@edit/*": ["./src/edit/*"],
```

- [ ] **Step 2: Write the failing test**

```tsx
// src/Entry.test.tsx
import { describe, expect, it } from "vitest"

import { routeFor } from "@app/Entry"

describe("routeFor", () => {
  it("returns 'edit' for /edit-resume", () => {
    expect(routeFor("/edit-resume")).toBe("edit")
  })

  it("returns 'app' for the root path", () => {
    expect(routeFor("/")).toBe("app")
  })

  it("returns 'app' for any other path", () => {
    expect(routeFor("/whatever")).toBe("app")
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun run test src/Entry.test.tsx`
Expected: FAIL — `routeFor` is not exported from `@app/Entry`.

- [ ] **Step 4: Update `Entry.tsx`**

```tsx
import React from "react"

import App from "@App"
import ReactDOM from "react-dom/client"

import EditResumeApp from "@edit/EditResumeApp"

import { applySky } from "@sky"

import "@styles/global.css"
import "@styles/keyframes.css"
import "@styles/tokens.css"

export function routeFor(pathname: string): "edit" | "app" {
  return pathname === "/edit-resume" ? "edit" : "app"
}

const isEdit = routeFor(window.location.pathname) === "edit"

if (!isEdit) applySky()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{isEdit ? <EditResumeApp /> : <App />}</React.StrictMode>
)
```

- [ ] **Step 5: Create the Netlify redirect**

```
/*  /index.html  200
```

Save as `public/_redirects` (Vite copies `public/` to the build root, so it ships as `dist/_redirects`).

- [ ] **Step 6: Run the test and full suite**

Run: `bun run test src/Entry.test.tsx && bun run test`
Expected: PASS — `routeFor` tests pass and nothing else regresses.

- [ ] **Step 7: Type-check and build**

Run: `bun ts:check && bun run build`
Expected: both succeed (alias resolves in TS and Vite; `_redirects` is copied to `dist/`).

- [ ] **Step 8: Manual smoke test**

Run: `bun dev`, then visit `http://localhost:4242/edit-resume`. Verify: the resume renders with the sidebar and no Sky/Weather/Nav/Footer; click **＋ New**, name it, confirm fields become editable inputs; edit the summary and a work bullet; add/remove an experience; click **Save**; reload and confirm the variation persists and re-opens with edits; click **Generate PDF** and confirm the file downloads. Visit `http://localhost:4242/` and confirm the public page is unchanged (Sky/Weather/Nav present, text not editable).

- [ ] **Step 9: Commit**

```bash
git add src/Entry.tsx src/Entry.test.tsx vite.config.ts tsconfig.json public/_redirects
git commit -m "$(cat <<'EOF'
CJR: route `/edit-resume` to the editor and add SPA redirect

- branch `Entry.tsx` on pathname via `routeFor`; skip `applySky` in edit mode
- add `@edit/*` alias to `vite.config.ts` and `tsconfig.json`
- add `public/_redirects` so Netlify deep-links serve `index.html`
EOF
)"
```

---

## Self-Review

**Spec coverage:**

- Hidden `/edit-resume` route → Task 13. ✓
- Only the resume, no chrome → Task 12 (`EditResumeApp` omits Sky/Weather/Nav/Footer/AppHeader; renders `Header` for identity). ✓
- Edit text in place across sections → Tasks 6–10. ✓
- Add/remove/reorder work experiences and bullets → Task 10. ✓
- Save synced to localStorage → Tasks 3, 12. ✓
- Name variations, keep multiple, re-edit → Tasks 3, 11, 12. ✓
- Generate PDF from active variation → Task 12. ✓
- Public page + `resume.json` never change → Global Constraints + view-mode invariant enforced in Tasks 2, 6–10; verified by existing tests staying green and Task 13 Step 8. ✓
- `resume.json` as immutable source of truth → Task 2 seeds via `structuredClone`; Base re-loads `resume.json`. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; every command lists expected output. The one conditional CSS note (Task 10 Step 4 `.bullets li`) gives an exact rule, not a vague instruction.

**Type consistency:** `setPath` signature identical in Tasks 1–2 and `EditableText`. `ResumeActions` method names (`loadData`, `setPath`, `addExperience`, `removeExperience`, `moveExperience`, `addAchievement`, `removeAchievement`, `moveAchievement`) match across Tasks 2, 10, 12. `useVariations` action names (`createVariation`, `renameVariation`, `deleteVariation`, `selectVariation`, `saveActive`) match across Tasks 3, 11, 12. `EditContext` value `{ editing, markDirty }` consistent across Tasks 4, 5, 8, 9, 10, 12. `Variation` shape consistent across Tasks 3, 11, 12. `toData`/`slugify` defined where used (Task 12).

**Dependency ordering note:** `@edit/*` alias is required by Task 4 onward; Task 4 instructs applying the two alias lines from Task 13 Step 1 early if running in order. Task 13 then commits them authoritatively alongside the route branch.
