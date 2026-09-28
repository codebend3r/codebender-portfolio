import { Fragment, useId, useMemo, useState } from "react"

import { resumeData } from "@data/resumeData"

import { findOverlaps } from "@utils/employmentOverlaps"
import { experienceId } from "@utils/experienceId"
import { parsePeriod } from "@utils/period"

import styles from "./TimelineFigure.module.css"

// The per-question overlap timeline (see the bot design spec's "The timeline
// figure" table). Ids come from the model's `[[timeline:...]]` marker
// (`parseAnswer`'s `AnswerBlock` of type "timeline"); every date, schedule,
// and arrangement shown here is looked up from the real resume, never from
// the model's text.
//
// Deviation from the spec's literal "Semantics" row: it calls for
// `aria-hidden="true"` on the whole chart (list view as the sole accessible
// form), but the bars are real, individually-keyboard-focusable `<button>`s
// with their own tooltip, per the same table's "Hover and focus" row —
// `aria-hidden` on an ancestor of a focusable control is a WCAG anti-pattern
// (focusable-but-hidden-from-AT) and fails CLAUDE.md's "every interactive
// element must be reachable ... by keyboard alone", which this task's brief
// says takes precedence. Only the purely decorative gridlines are
// `aria-hidden` here; the bars, their labels, and the overlap bands stay in
// the accessibility tree. The list view remains as a zoom/screen-reader
// friendly equivalent, just not the sole one.

type MonthBounds = { start: number; end: number }

// Exported alongside `computeBands` so a test can build a synthetic row/
// window pair directly, without going through `buildRows`' real-resume
// lookup.
export type TimelineRow = {
  id: string
  label: string
  company: string
  role: string
  schedule: EmploymentSchedule
  arrangement?: EmploymentArrangement
  bounds: MonthBounds
  isPresent: boolean
}

export type TimelineWindow = { start: number; end: number }

export type OverlapBand = {
  key: string
  leftPct: number
  widthPct: number
  label: string
  topRow: number
  bottomRow: number
}

type YearTick = { year: number; label: string; leftPct: number }

// The natural window (earliest listed start to latest end/now) is clamped
// into this range: widened up to a minimum so a single short stint still
// reads as a visible bar, and capped at a maximum so a long-running
// consultancy (Codebender Inc., running since 2011) doesn't stretch the
// chart so wide that everything else collapses to a sliver. A role whose
// real start falls before the clamped window is drawn clipped, with a
// square left edge, and its true start still shows in the tooltip.
const MIN_WINDOW_YEARS = 5
const MAX_WINDOW_YEARS = 8
const LABEL_FALLBACK_SCHEDULE: EmploymentSchedule = "full-time"

function monthLabel(monthIndex: number): string {
  const year = Math.floor(monthIndex / 12)
  const month = (monthIndex % 12) + 1
  return `${String(month).padStart(2, "0")}/${year}`
}

function dateRangeLabel(row: TimelineRow): string {
  const end = row.isPresent ? "now" : monthLabel(row.bounds.end)
  return `${monthLabel(row.bounds.start)} to ${end}`
}

function scheduleLabel(schedule: EmploymentSchedule): string {
  return schedule === "part-time" ? "Part-time" : "Full-time"
}

function arrangementLabel(arrangement?: EmploymentArrangement): string {
  if (arrangement === "permanent") return "Permanent"
  if (arrangement === "contract") return "Contract"
  return "—"
}

// Routes through `arrangementLabel` (same as the list-view table) so a
// missing `arrangement` reads as "unknown", never as a silently invented
// "contract" — both views must agree on the same real data.
function tooltipEmployment(row: TimelineRow): string {
  const arrangement = arrangementLabel(row.arrangement)
  if (arrangement === "—") return scheduleLabel(row.schedule)
  return `${scheduleLabel(row.schedule)}, ${arrangement.toLowerCase()}`
}

function buildRows({
  ids,
  now,
}: {
  ids: readonly string[]
  now: Date
}): TimelineRow[] {
  const wanted = new Set(ids)
  const rows = resumeData.work_experience.reduce<TimelineRow[]>(
    (acc, entry) => {
      const id = experienceId({ company: entry.company, period: entry.period })
      if (!wanted.has(id)) return acc

      const bounds = parsePeriod({ period: entry.period, now })
      if (!bounds) return acc

      return [
        ...acc,
        {
          id,
          label: entry.short ?? entry.company,
          company: entry.company,
          role: entry.role,
          schedule: entry.schedule ?? LABEL_FALLBACK_SCHEDULE,
          arrangement: entry.arrangement,
          bounds,
          isPresent: entry.period.trim().toLowerCase().endsWith("present"),
        },
      ]
    },
    []
  )

  return [...rows].sort((a, b) => b.bounds.start - a.bounds.start)
}

function computeWindow(rows: readonly TimelineRow[]): TimelineWindow {
  const naturalStart = Math.min(...rows.map((row) => row.bounds.start))
  const naturalEnd = Math.max(...rows.map((row) => row.bounds.end))
  const naturalSpan = naturalEnd - naturalStart + 1
  const clampedSpan = Math.min(
    Math.max(naturalSpan, MIN_WINDOW_YEARS * 12),
    MAX_WINDOW_YEARS * 12
  )
  return { start: naturalEnd - clampedSpan + 1, end: naturalEnd }
}

function barGeometry({
  bounds,
  timeWindow,
}: {
  bounds: MonthBounds
  timeWindow: TimelineWindow
}): { leftPct: number; widthPct: number; clipped: boolean } {
  const span = timeWindow.end - timeWindow.start + 1
  const clippedStart = Math.max(bounds.start, timeWindow.start)
  return {
    leftPct: ((clippedStart - timeWindow.start) / span) * 100,
    widthPct: ((bounds.end + 1 - clippedStart) / span) * 100,
    clipped: bounds.start < timeWindow.start,
  }
}

function yearTicks(timeWindow: TimelineWindow): YearTick[] {
  const span = timeWindow.end - timeWindow.start + 1
  const firstYear = Math.ceil(timeWindow.start / 12)
  const lastYear = Math.floor(timeWindow.end / 12)
  const count = Math.max(lastYear - firstYear + 1, 0)
  return Array.from({ length: count }, (_, index) => {
    const year = firstYear + index
    return {
      year,
      label: `'${String(year).slice(2)}`,
      leftPct: ((year * 12 - timeWindow.start) / span) * 100,
    }
  })
}

// Exported so its band-placement math can be unit tested against a
// synthetic experience list, independent of whatever full-time overlaps (if
// any) the real resume currently happens to contain.
export function computeBands({
  rows,
  timeWindow,
  now,
  experience = resumeData.work_experience,
}: {
  rows: readonly TimelineRow[]
  timeWindow: TimelineWindow
  now: Date
  experience?: Parameters<typeof findOverlaps>[0]["experience"]
}): OverlapBand[] {
  const rowIndexById = new Map(rows.map((row, index) => [row.id, index]))
  const span = timeWindow.end - timeWindow.start + 1
  const overlaps = findOverlaps({ experience, now })

  return overlaps.reduce<OverlapBand[]>((acc, overlap) => {
    if (overlap.kind !== "full-time") return acc

    const indexA = rowIndexById.get(overlap.a.id)
    const indexB = rowIndexById.get(overlap.b.id)
    if (indexA === undefined || indexB === undefined) return acc

    const rowA = rows[indexA]
    const rowB = rows[indexB]
    const overlapStart = Math.max(rowA.bounds.start, rowB.bounds.start)
    const overlapEnd = Math.min(rowA.bounds.end, rowB.bounds.end)
    const clippedStart = Math.max(overlapStart, timeWindow.start)
    const clippedEnd = Math.min(overlapEnd, timeWindow.end)
    if (clippedEnd < clippedStart) return acc

    return [
      ...acc,
      {
        key: `${overlap.a.id}__${overlap.b.id}`,
        leftPct: ((clippedStart - timeWindow.start) / span) * 100,
        widthPct: ((clippedEnd + 1 - clippedStart) / span) * 100,
        label: `${overlap.months} ${overlap.months === 1 ? "month" : "months"}`,
        topRow: Math.min(indexA, indexB),
        bottomRow: Math.max(indexA, indexB),
      },
    ]
  }, [])
}

export type TimelineFigureProps = {
  // Ids from the model's `[[timeline:...]]` marker; unknown ids (not in the
  // resume) are dropped silently, same as `parseAnswer`'s own rule.
  ids: readonly string[]
  // Clicking a bar acts like activating a "From the resume" source chip.
  onActivateRole?: (id: string) => void
  now?: Date
}

export function TimelineFigure({
  ids,
  onActivateRole,
  now = new Date(),
}: TimelineFigureProps) {
  const [view, setView] = useState<"chart" | "list">("chart")
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const titleId = useId()

  const rows = useMemo(() => buildRows({ ids, now }), [ids, now])
  const timeWindow = useMemo(
    () => (rows.length >= 2 ? computeWindow(rows) : null),
    [rows]
  )
  const bands = useMemo(
    () => (timeWindow ? computeBands({ rows, timeWindow, now }) : []),
    [rows, timeWindow, now]
  )
  const ticks = useMemo(
    () => (timeWindow ? yearTicks(timeWindow) : []),
    [timeWindow]
  )

  if (rows.length < 2 || !timeWindow) return null

  const nowIndex = now.getFullYear() * 12 + now.getMonth()
  const startYear = Math.floor(timeWindow.start / 12)
  const endYear = Math.floor(timeWindow.end / 12)
  const caption =
    timeWindow.end === nowIndex
      ? `Roles ${startYear} to now`
      : `Roles ${startYear} to ${endYear}`

  const activate = (id: string) => onActivateRole?.(id)

  return (
    <figure className={styles.figure} aria-labelledby={titleId}>
      <figcaption id={titleId} className={styles.caption}>
        {caption}
      </figcaption>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setView(view === "chart" ? "list" : "chart")}
        >
          {view === "chart" ? "View as list" : "View as chart"}
        </button>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.fullTimeSwatch}`} />
          Full-time
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.partTimeSwatch}`} />
          Part-time
        </span>
      </div>

      {view === "chart" ? (
        <div className={styles.chart}>
          <div
            className={styles.plot}
            style={{
              gridTemplateRows: `repeat(${rows.length}, minmax(1.5rem, auto)) 1rem`,
            }}
          >
            {ticks.map((tick) => (
              <span
                key={tick.year}
                className={styles.gridline}
                style={{ gridRow: `1 / ${rows.length + 1}` }}
                aria-hidden="true"
              >
                <span
                  className={styles.gridlineMark}
                  style={{ left: `${tick.leftPct}%` }}
                />
              </span>
            ))}

            {bands.map((band) => (
              <span
                key={band.key}
                className={styles.band}
                style={{
                  gridRow: `${band.topRow + 1} / ${band.bottomRow + 2}`,
                }}
              >
                <span
                  className={styles.bandBox}
                  style={{
                    left: `${band.leftPct}%`,
                    width: `${band.widthPct}%`,
                  }}
                >
                  <span className={styles.bandLabel}>{band.label}</span>
                </span>
              </span>
            ))}

            {rows.map((row, index) => {
              const geometry = barGeometry({ bounds: row.bounds, timeWindow })
              const barClass = [
                styles.bar,
                row.schedule === "part-time" ? styles.partTimeBar : "",
                geometry.clipped ? styles.clippedBar : "",
              ]
                .filter(Boolean)
                .join(" ")

              return (
                <Fragment key={row.id}>
                  <span
                    className={styles.rowLabel}
                    style={{ gridRow: index + 1 }}
                  >
                    {row.label}
                    {row.schedule === "part-time" && (
                      <span className={styles.partTimeLabel}>part-time</span>
                    )}
                  </span>
                  <span className={styles.track} style={{ gridRow: index + 1 }}>
                    <button
                      type="button"
                      className={barClass}
                      style={{
                        left: `${geometry.leftPct}%`,
                        width: `${geometry.widthPct}%`,
                      }}
                      aria-label={`${row.role}, ${row.company}, ${dateRangeLabel(row)}, ${tooltipEmployment(row)}`}
                      onMouseEnter={() => setActiveTooltip(row.id)}
                      onMouseLeave={() =>
                        setActiveTooltip((current) =>
                          current === row.id ? null : current
                        )
                      }
                      onFocus={() => setActiveTooltip(row.id)}
                      onBlur={() =>
                        setActiveTooltip((current) =>
                          current === row.id ? null : current
                        )
                      }
                      onClick={() => activate(row.id)}
                    />
                    {activeTooltip === row.id && (
                      <span role="tooltip" className={styles.tooltip}>
                        <span className={styles.tooltipRole}>{row.role}</span>
                        <span className={styles.tooltipLine}>
                          {row.company}
                        </span>
                        <span className={styles.tooltipLine}>
                          {dateRangeLabel(row)}
                        </span>
                        <span className={styles.tooltipLine}>
                          {tooltipEmployment(row)}
                        </span>
                      </span>
                    )}
                  </span>
                </Fragment>
              )
            })}

            <span className={styles.axis} style={{ gridRow: rows.length + 1 }}>
              {ticks.map((tick) => (
                <span
                  key={tick.year}
                  className={styles.tick}
                  style={{ left: `${tick.leftPct}%` }}
                >
                  {tick.label}
                </span>
              ))}
            </span>
          </div>
        </div>
      ) : (
        <table className={styles.table}>
          <caption className={styles.srOnly}>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Company</th>
              <th scope="col">Role</th>
              <th scope="col">Dates</th>
              <th scope="col">Schedule</th>
              <th scope="col">Arrangement</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.company}</td>
                <td>{row.role}</td>
                <td>{dateRangeLabel(row)}</td>
                <td>{scheduleLabel(row.schedule)}</td>
                <td>{arrangementLabel(row.arrangement)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  )
}
