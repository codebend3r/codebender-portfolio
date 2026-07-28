# Resume Variations + `/edit-resume` route — Design

**Date:** 2026-06-30
**Status:** Approved

## Goal

Let the user create multiple named, editable **variations** of the resume,
tailored for different audiences, and generate a PDF from any one of them —
without ever mutating the canonical source.

`src/data/resume.json` stays the **immutable base / source of truth**. Both the
on-screen resume and the generated PDF are two renderers of one `Data` object. A
variation is a named, deep-cloned copy of `Data` with edits, persisted to
`localStorage`. The public `/` route is untouched — it always renders
`resume.json`.

## Requirements

1. A hidden route `/edit-resume` renders only the resume (no Sky, Weather,
   SectionNav, AppHeader chrome, or Footer) using the existing styled resume
   components.
2. On that route, the user can edit text in place across all sections.
3. The user can **add / remove / reorder** work experiences and their
   achievement bullets.
4. The user can save the current edits, synced to `localStorage`.
5. The user can name each variation, and maintain **multiple** variations,
   returning later to edit any of them further.
6. The user can generate a PDF from the active (edited) variation.
7. The public `/` page and the canonical `resume.json` are never modified by any
   of the above.

## Architecture

The reused resume components (`Header`, `Summary`, `WorkExperience`, …) read
their slice from `useStore()`. To reuse them as the editor with variation data,
the draft being edited _is_ `useStore`'s state on the edit route. This is the
lowest-churn approach and guarantees the editor layout cannot drift from the
public layout, because it is literally the same components.

Two stores:

- **`useStore`** (existing, extended) — the live **draft** `Data` plus edit
  actions. On `/`, it is seeded from `resume.json` and the actions are simply
  never called. On `/edit-resume`, the active variation's `data` is loaded into
  it, and edits mutate it.
- **`useVariations`** (new) — the persisted catalog of saved variations and
  which one is active.

Routing is a `pathname` branch in `Entry.tsx`; no router library is added.

### Module map

| Module | Responsibility |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/Entry.tsx` | Branch on `window.location.pathname`. `/edit-resume` → mount `EditResumeApp`; everything else → mount `App` (unchanged, the only caller of `applySky()`). |
| `src/edit/EditResumeApp.tsx` | Edit-page root. No chrome. Grid layout: `VariationsPanel` sidebar \| resume sections wrapped in `<EditProvider>`. Loads the active variation (or Base) into `useStore` on mount / on selection change. |
| `src/edit/VariationsPanel.tsx` | Sidebar. "Base (original)" pinned + read-only at top; each saved variation with inline rename (✎) + delete (✕); "＋ New" button; **Save** + **Generate PDF** at the bottom; a dirty indicator when there are unsaved edits. |
| `src/edit/EditContext.tsx` | `EditProvider` + `useEditing()` hook exposing `{ editing: boolean }`. Present only on the edit route; `editing` is `true` only when a real variation (not Base) is selected. |
| `src/edit/EditableText.tsx` | Inline field. **View mode** (no provider / `editing===false`): renders the bare string — identical DOM to today. **Edit mode**: a borderless auto-sizing `input` (single-line) or auto-grow `textarea` (`multiline`), styled to look like the surrounding text until hover/focus. Commits via `useStore` action on change. |
| `src/edit/EditResumeApp.module.css`, `VariationsPanel.module.css`, `EditableText.module.css` | Colocated CSS Modules. Spacing via grid + gap, no margins (per project convention). |
| `src/state/useStore.ts` | Extended from `Data` to `Data & Actions`. Adds `loadData(data)`, `setPath(path, value)`, `addExperience`/`removeExperience`/`moveExperience`, `addAchievement`/`removeAchievement`/`moveAchievement`. |
| `src/state/useVariations.ts` | New zustand store with `persist` middleware (key `resume-variations`). State `{ variations: Variation[]; activeId: string                                                                                                                                                                                                  | null }`. Actions `createVariation`, `renameVariation`, `deleteVariation`, `selectVariation`, `saveActive(data)`. |
| `src/utils/setPath.ts` | Pure immutable set-by-path helper used by `useStore.setPath`. |
| `public/_redirects` | `/*  /index.html  200` so Netlify deep-links to `/edit-resume` serve the SPA. |

### Types

Added to `src/types/global.d.ts`:

```ts
type Variation = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  data: Data
}
```

`setPath` accepts a path expressed as an array of string/number keys (e.g.
`["work_experience", 2, "achievements", 0]`), so no string parsing is needed and
array indices are unambiguous.

## Data flow

1. `Entry.tsx` checks `window.location.pathname`. `/edit-resume` mounts
   `EditResumeApp`; any other path mounts `App` exactly as today.
2. `EditResumeApp` mounts; `useVariations` rehydrates from `localStorage`. If
   `activeId` resolves to a saved variation, its `data` is loaded into
   `useStore`; otherwise **Base** is shown (`useStore` seeded from
   `resume.json`, editing disabled).
3. Selecting an entry in the sidebar calls `selectVariation(id)` →
   `useStore.loadData(variation.data)` and clears the dirty flag. Selecting Base
   loads `resume.json` and disables editing.
4. Inline edits call `useStore` actions (`setPath`, structural actions) → mutate
   the draft → set a local dirty flag in `EditResumeApp`. Reorder uses up/down
   buttons (no drag-and-drop dependency).
5. **Save** calls `saveActive(useStore.getState())` (stripping the action
   functions to persist only `Data`), sets `updatedAt = Date.now()`, persisted
   by the middleware, and clears dirty. Save is disabled on Base.
6. **New** prompts for a name, deep-clones the **currently displayed** data
   (Base or another variation) into a new `Variation`, selects it, and enables
   editing — so a variation can branch from anything.
7. **Generate PDF** reuses `generateResumePdf(useStore.getState())` +
   `downloadBlob` (dynamic `import("@pdf")`, same as `App`), filename slugified
   from the active variation name (`cj_rivas_<slug>.pdf`); Base uses the existing
   default filename.
8. A `beforeunload` guard warns when leaving with unsaved edits (dirty).

## Edit scope

- **Text, everywhere, inline:** name, title, every contact field, summary,
  technical skills entries, each work experience's role/company/period and each
  achievement, each showcase field's text, awards, languages, education.
- **Structural add / remove / reorder:** work experiences and their achievement
  bullets only.
- Skills, showcase, awards, languages, education are text-editable but have **no**
  add/remove in this iteration. Showcase images are not edited inline.

## Routing / config

- Path route `/edit-resume` via a `pathname` check in `Entry.tsx`. Vite dev
  server already serves `index.html` for unknown paths, so `bun dev` works
  without extra config.
- New `public/_redirects` with `/*  /index.html  200` for the Netlify deploy.
- New `@edit/*` alias added to **both** `vite.config.ts` (`resolve.alias`) and
  `tsconfig.json` (`compilerOptions.paths`), kept in sync per the alias
  convention.

## Decisions (resolved)

- **Base is read-only.** To edit, the user creates a variation from it. This
  keeps `resume.json` unambiguously canonical and makes "reset to original"
  trivial (just re-select Base).
- **Reorder via up/down buttons**, not drag-and-drop — avoids a new dependency.
- **Styled `input`/`textarea`** for inline editing, not `contentEditable` —
  avoids React cursor-jump issues and keeps commits going through store actions.
- **Two stores, not one.** `useStore` holds the transient draft; `useVariations`
  owns persistence. Keeping persistence out of `useStore` means the public page's
  store behavior is unchanged.

## Testing

Vitest + Testing Library, colocated as usual:

- `src/state/useVariations.test.ts` — create / rename / delete / select / save,
  and `localStorage` round-trip.
- `src/state/useStore.test.ts` (extended) — action reducers: `setPath`,
  add/remove/move for experiences and achievements; existing seed test still
  passes.
- `src/utils/setPath.test.ts` — immutable set-by-path, including nested array
  indices and no-mutation of the source.
- `src/edit/EditableText.test.tsx` — **view mode renders plain text (identical
  DOM)**; edit mode renders an input and commits on change.
- `src/edit/VariationsPanel.test.tsx` — list renders, New/rename/delete wiring,
  Save/Generate disabled on Base.
- `src/edit/EditResumeApp.test.tsx` — selecting a variation loads it; dirty flag
  behavior.

**Critical invariant:** view-mode output of `EditableText` is byte-identical to
the current text nodes, so every existing component test and the public page
stay green.

## Out of scope

- Drag-and-drop reordering.
- Add/remove for skills, showcase, awards, languages, education.
- Editing showcase images.
- Server-side persistence or auth (localStorage only; the route is "hidden" by
  obscurity, not secured).
- Exporting / importing variations as files.
