# Section contrast and hierarchy refresh

Date: 2026-06-09
Status: Approved (pending implementation)

## Problem

Section panels currently use near-transparent backgrounds (`rgba(255,255,255,0.02 → 0.01)` over a dark border) layered on top of the animated parallax sky. The sky aesthetic is good, but section content is hard to read against it. The goal is to push contrast up while keeping the sky atmosphere intact, and to add a small layer of typographic hierarchy alongside that change so the result lands as a finished design pass rather than a bare token swap.

## Goals

- Section content reads cleanly against the sky in all conditions (day, dusk, night).
- The animated sky still feels present behind the panels (no opaque "hole in the page").
- Section rhythm gets a small lift: a numbered eyebrow chip, a gradient heading, and an accent rail inside the work timeline.
- Zero data shape changes. No new dependencies. No new state.

## Non-goals

- No redesign of the sky, weather, or starfield components.
- No change to the PDF download path beyond ensuring the new panel treatment renders to PDF.
- No new sections, no copy edits to `resume.json`.
- No accent color palette overhaul. The existing `--accent` (cyan-blue) and `--accent2` (purple) stay.

## Design direction

Panel treatment uses a tinted-glass recipe: mostly opaque toward `--panel`, with a light backdrop blur, a faint accent-colored border (using `--accent`), a soft outer shadow, and an inner top highlight. The sky drifts behind the panel blurred and dimmed, instead of bleeding through unchanged.

Each section (except Summary) gets a numbered eyebrow chip ("01 · Stack", "02 · Experience", etc.) in monospaced uppercase with the accent color. Section headings move from plain `var(--text)` to a left-to-right gradient that lands on `--accent2` at the right edge. Summary stays chip-less so the page opens with prose rather than a numbered label.

Work experience items lose their inner panel (they were nested panels, doubling the borders) and gain an accent rail running down the left edge, fading from `--accent` at the top to transparent at the bottom.

## Architecture

This is presentational only. State, data flow, routing, build, and dependencies are unchanged.

### Component changes

| File                                       | Change                                                                                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles/tokens.css`                    | Add `--panel-overlay` (tinted-glass gradient) and `--panel-edge` (accent border color).                                                                                            |
| `src/components/Section.module.css`        | Replace panel background, border, padding, shadow, blur. Add `.chip` and `.chipDot` rules. Update h2 to gradient. Add `@media print` overrides. Add mobile breakpoint adjustments. |
| `src/components/Section.tsx`               | Add optional `index?: number` and `eyebrow?: string` props. Render chip when both are present.                                                                                     |
| `src/App.tsx`                              | Pass `index` + `eyebrow` to each section component except `<Summary />`.                                                                                                           |
| `src/components/TechnicalSkills.tsx`       | Accept `index` + `eyebrow` props, forward to `<Section>`.                                                                                                                          |
| `src/components/WorkExperience.tsx`        | Same forwarding.                                                                                                                                                                   |
| `src/components/Awards.tsx`                | Same forwarding.                                                                                                                                                                   |
| `src/components/Languages.tsx`             | Same forwarding.                                                                                                                                                                   |
| `src/components/Education.tsx`             | Same forwarding.                                                                                                                                                                   |
| `src/components/WorkExperience.module.css` | Remove inner panel from `.item` (no background, no border, no padding). Add accent rail via grid + `::before`. Remove gradient from `.item h3` (gradient now lives on section h2). |

### Section API

```tsx
export function Section({
  title,
  index,
  eyebrow,
  children,
}: {
  title: string
  index?: number
  eyebrow?: string
  children: React.ReactNode
}) {
  const hasChip = index !== undefined && eyebrow
  return (
    <section className={styles.section}>
      {hasChip && (
        <span className={styles.chip}>
          <span className={styles.chipDot} aria-hidden />
          {String(index).padStart(2, "0")} · {eyebrow}
        </span>
      )}
      <h2>{title}</h2>
      {children}
    </section>
  )
}
```

Both props are optional and only render the chip when both are passed. This keeps Summary chip-less without conditional logic at the call site.

### Mounting in `App.tsx`

```tsx
<Summary />
<TechnicalSkills index={1} eyebrow="Stack" />
<WorkExperience index={2} eyebrow="Experience" />
<div className={styles.subgrid}>
  <Awards index={3} eyebrow="Recognition" />
  <Languages index={4} eyebrow="Languages" />
  <Education index={5} eyebrow="Education" />
</div>
```

### Token additions (`tokens.css`)

```css
--panel-overlay: linear-gradient(
  180deg,
  rgba(17, 22, 34, 0.78),
  rgba(11, 14, 20, 0.82)
);
--panel-edge: rgba(122, 162, 247, 0.22);
```

The gradient top is `--panel` (`#111622` = `17, 22, 34`) at 78% opacity; the gradient bottom is `--bg` (`#0b0e14` = `11, 14, 20`) at 82%. The edge color is `--accent` (`#7aa2f7` = `122, 162, 247`) at 22%. Hard-coded RGBA is used instead of `color-mix(in srgb, ...)` so the design works in browsers older than Safari 16.4 / Chrome 111.

### Section panel recipe (`Section.module.css`)

```css
.section {
  background: var(--panel-overlay);
  border: 1px solid var(--panel-edge);
  border-radius: 16px;
  padding: 22px 22px 24px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.section h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.015em;
  background: linear-gradient(90deg, var(--text) 0%, var(--accent2) 130%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.chip {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
  padding: 4px 9px;
  border: 1px solid rgba(122, 162, 247, 0.35);
  border-radius: 999px;
  background: rgba(122, 162, 247, 0.08);
}

.chipDot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
}

@media (max-width: 700px) {
  .section {
    padding: 16px 16px 18px;
    border-radius: 12px;
    gap: 12px;
  }

  .section h2 {
    font-size: 19px;
  }
}

@media print {
  .section {
    background: var(--panel);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow: none;
  }

  .section h2 {
    background: none;
    -webkit-text-fill-color: initial;
    color: var(--text);
  }
}
```

### Work experience item refinement (`WorkExperience.module.css`)

The current `.item` is itself a panel (`background: var(--panel)`, `border: 1px solid var(--border)`). Now that the parent Section is the panel, the item flattens into the section interior with an accent rail down the left edge.

```css
.item {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 3px 1fr;
  gap: 14px;
}

.item::before {
  content: "";
  background: linear-gradient(180deg, var(--accent) 0%, transparent 100%);
  border-radius: 2px;
}

.item h3 {
  margin: 0;
  font-family: var(--font-role);
  font-style: italic;
  font-weight: 400;
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: 0.2px;
  background: none;
  -webkit-text-fill-color: initial;
  color: var(--text);
}
```

The h3 gradient is removed. With the section h2 now carrying a gradient, having two gradient headings stacked inside one panel made the page feel gradient-heavy. The serif italic + 28px size keep the role visually dominant on its own.

Mobile and print blocks stay as today minus the `.item h3` gradient handling (which is no longer needed because the gradient is gone).

### Awards / Education / Languages

These already have minimal markup. No structural changes. The improved contrast comes from the parent Section panel. If list items feel under-styled relative to the new panel weight, a follow-up can add a small treatment (bold key term in `--text`, secondary in `--muted`, monospaced year in `--accent2`), but that is out of scope for this spec.

## Testing strategy

- `Section.test.tsx`: add two test cases.
  - Renders chip text `"02 · Experience"` when `index={2}` and `eyebrow="Experience"` are passed.
  - Does not render any chip element when either prop is missing.
- Component tests for `TechnicalSkills`, `WorkExperience`, `Awards`, `Languages`, `Education`: update mounting in existing tests to pass the new props. Assert chip text is present.
- If an `App.test.tsx` exists: assert Summary is chip-less (`queryByText` for "01 · Summary" returns null) and that `"01 · Stack"` is present.
- No new test files. No mock or snapshot infrastructure changes.

CSS is not tested directly, consistent with the rest of the repo.

## Risks and mitigations

1. **`backdrop-filter` does not rasterize reliably in html2pdf / html2canvas.** The PDF download path could produce sections that look transparent. Mitigated by the `@media print` block in `Section.module.css` that swaps `--panel-overlay` for solid `var(--panel)` and disables the blur and shadow.
2. **Gradient text rendering in PDF.** Same path. The `@media print` block resets the h2 gradient to solid `var(--text)` so the PDF reads cleanly.
3. **Visual regression on mobile.** The new chip + larger heading + content stack could feel cramped at narrow widths. Mitigated by the mobile breakpoint adjustments in `Section.module.css` (smaller padding, smaller heading, tighter gap).
4. **Cohesion of gradient h2 + solid serif h3 across all sections.** Most sections do not have a serif h3, so the visual rhythm is consistent across the page. WorkExperience is the one section that mixes the two, and the gradient lives only on the section heading. This is a judgment call; if it does not land in the browser, reverting the h3 to solid `var(--text)` is a single-rule revert (already proposed) and the alternative is one CSS rule away.

## Rollback

Every change is in CSS plus six small JSX edits. `git revert <commit>` restores the previous look. No data, dependencies, or API contracts change.

## Out of scope (possible follow-ups)

- Refining list items inside Awards / Education / Languages (key-term + meta + mono date treatment).
- Hover affordances on Work Experience items (lift, rail brighten).
- A "section divider" between major page regions if the page feels uniform after this pass.
- Reusing the chip pattern in AppHeader or Footer.

Each is independent and can be picked up after this pass ships.
