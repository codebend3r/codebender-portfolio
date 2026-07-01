# Section drag-and-drop design

Date: 2026-07-01
Status: approved

## Goal

On the edit page (`/edit-resume`), every list of resume information can be
reordered by drag and drop, within its own list only. The public page is
unaffected visually and pays no bundle cost.

## Scope

Draggable lists:

- `work_experience` entries, and `achievements` within each entry
- `technical_skills` pills; `skill_descriptions` reorders in lockstep so each
  pill keeps its hover text
- `showcase` cards, and `tags` within each card (tags drag as whole chips;
  they remain non-text-editable)
- `awards`, `languages`, `education` entries

No dragging between sections or between different parents (an achievement
cannot move to another experience). The existing up/down arrow buttons in
`WorkExperience` are removed; drag handles replace them. Add (`+`) and remove
(`✕`) buttons stay.

## Library

`@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`. Chosen over
`@formkit/drag-and-drop` (weaker keyboard accessibility, riskier around
contentEditable) and a hand-rolled pointer implementation (large surface:
hit-testing, touch, auto-scroll, keyboard). Native HTML5 DnD was rejected
outright (no touch support, conflicts with contentEditable).

## Store

One generic action on `useStore`:

```ts
reorder(path: PathKey[], from: number, to: number)
```

Moves the element at `from` to index `to` within the array located at `path`,
reusing `setPath` for the immutable update. No-op when `from === to` or either
index is out of range. Call sites:

- `reorder(["awards"], f, t)` and similar for languages, education, showcase
- `reorder(["work_experience", i, "achievements"], f, t)`
- `reorder(["showcase", i, "tags"], f, t)`
- TechnicalSkills calls it twice per drop: `["technical_skills"]` then
  `["skill_descriptions"]`

`moveExperience` and `moveAchievement` are deleted from the store, types, and
tests; `reorder` covers them.

## Components

New `src/edit/SortableList.tsx` (+ colocated module CSS and tests) exporting:

- `SortableList` props: `{ onReorder(from, to), children }`. When `editing`
  is false (from `EditContext`), renders children as-is with zero DnD
  wrappers. When editing, lazy-loads the dnd-kit implementation via
  `React.lazy`; the Suspense fallback renders children plainly, so handles
  appear once the chunk loads. The inner implementation provides
  `DndContext` + `SortableContext` (vertical or default strategy), pointer
  sensor with a small activation distance, and keyboard sensor. On drop it
  maps active/over ids to indices, calls `onReorder(from, to)`, then
  `markDirty()`.
- `SortableItem` props: `{ index, as = "li", className, dragWholeItem?,
children }`. `children` is a render prop receiving `handle` (a grip button
  `ReactNode`, or `null` when DnD is inactive). Items use index-based ids;
  stable identity ids are unnecessary because the drop handler only needs
  from/to indices. With `dragWholeItem`, listeners attach to the wrapper
  element itself and `handle` is `null` (used by showcase tags).
- Bridge: `SortableItem` reads a module-level context that the lazy inner
  provides; when absent it renders the plain wrapper element. This keeps all
  static dnd-kit imports inside the lazy chunk.

Interaction: grip (`⠿`) button per item, visible only in edit mode. Pointer
drag from the grip; keyboard reorder by focusing the grip, Space/Enter to
lift, arrows to move, Space/Enter to drop, Escape to cancel. Dragging only
from the handle keeps `EditableText` click-to-edit working.

Nested lists (achievements, tags) each get their own `DndContext`, which also
structurally prevents cross-list drops.

## Section wiring

Each section keeps its own container markup; `SortableItem` replaces the
existing `li`/`span` item wrapper:

- WorkExperience: grip in the row controls where the arrows were; nested
  sortable achievements with a grip per bullet.
- TechnicalSkills: grip inside each pill; lockstep double `reorder`; the
  hover-text editor below follows automatically because it maps the same
  array.
- Showcase: grip in the card frame bar; tags drag as whole chips
  (`dragWholeItem`).
- Awards, Languages, Education: one grip per entry.

Every drop marks the session dirty exactly like text edits.

## Testing

- Store: `reorder` unit tests (top-level path, nested path, `from === to`
  no-op, out-of-range no-op, immutability).
- SortableList: no handles or DnD wrappers when not editing; handles render
  in edit mode; drag-end index mapping calls `onReorder` correctly (unit
  test the handler mapping; jsdom cannot exercise real pointer drags).
- Sections: per-section tests assert grips render in edit mode and are
  absent on the public page; WorkExperience arrow tests replaced.
- `bun run system-check` passes.
