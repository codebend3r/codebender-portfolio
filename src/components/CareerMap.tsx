import { Fragment, useEffect, useId, useRef, useState } from "react"
import type { RefObject } from "react"

import styles from "@components/CareerMap.module.css"

import { useStore } from "@state/useStore"

import {
  barFor,
  careerRange,
  periodBounds,
  popoverPlacement,
  yearTicks,
} from "@utils/careerMap"
import type {
  CareerRange,
  PeriodBounds,
  PopoverPlacement,
} from "@utils/careerMap"
import { formatEmployment, partitionExperience } from "@utils/employment"
import { experienceDuration } from "@utils/experienceDuration"
import { isObscured } from "@utils/isObscured"
import { formatPeriod } from "@utils/period"

type Track = "fullTime" | "partTime" | "side"

type Slot = {
  key: string
  track: Track
  entry: Experience
  bounds: PeriodBounds
}

type Lane = {
  track: Track
  label: string
  slots: Slot[]
}

// Each lane class only sets `--tone`/`--tone-ink`, so the bars, legend
// swatches, popover accent, and axis highlight all read one colour per track.
const TRACK_CLASS: Record<Track, string> = {
  fullTime: styles.fullTime,
  partTime: styles.partTime,
  side: styles.side,
}

type Placement = PopoverPlacement & { side: "above" | "below" }

// The reveal sweeps the whole axis in this long; each bar starts when the
// sweep reaches its left edge and finishes when it reaches its right edge.
const SWEEP_MS = 1600

// Clearance past the popover's measured height when probing whether its far
// edge would be covered: the gap to the bar plus the caret.
const PROBE_SLACK_PX = 16

// Oldest first, so tab order runs left to right along the timeline.
const toSlots = ({
  entries,
  track,
}: {
  entries: readonly Experience[]
  track: Track
}): Slot[] =>
  entries
    .flatMap((entry) => {
      const bounds = periodBounds({ period: entry.period })
      return bounds
        ? [{ key: `${entry.company}-${entry.period}`, track, entry, bounds }]
        : []
    })
    .sort((a, b) => a.bounds.start - b.bounds.start)

const barText = (slot: Slot): string =>
  slot.track === "side"
    ? `Side projects · ${Math.floor(slot.bounds.start)} → now`
    : (slot.entry.short ?? "")

// The accessible name contains the visible label (WCAG 2.5.3), so a speech
// user can say what they see; unlabelled short stints fall back to the
// company alone.
const barName = (slot: Slot): string =>
  slot.track === "side"
    ? `${slot.entry.company}: ${barText(slot)}`
    : slot.entry.company

// Flips to true the first time the map scrolls into view, so the reveal
// plays where the visitor can see it rather than on mount below the fold.
// Without IntersectionObserver there is nothing to wait for.
function useRevealOnView(ref: RefObject<HTMLElement | null>): boolean {
  const [revealed, setRevealed] = useState(
    () => typeof IntersectionObserver === "undefined"
  )

  useEffect(() => {
    const node = ref.current
    if (revealed || !node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setRevealed(true)
        observer.disconnect()
      },
      { threshold: 0.4 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref, revealed])

  return revealed
}

function CareerBar({
  slot,
  range,
  popoverId,
  open,
  frameRef,
  onShow,
  onHide,
}: {
  slot: Slot
  range: CareerRange
  popoverId: string
  open: boolean
  frameRef: RefObject<HTMLElement | null>
  onShow: (key: string) => void
  onHide: (key: string) => void
}) {
  const itemRef = useRef<HTMLLIElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<Placement | null>(null)

  const { entry, bounds, key } = slot
  const bar = barFor({ bounds, range })
  const meta = [
    formatPeriod({ period: entry.period }),
    experienceDuration(entry.period),
  ]
    .filter(Boolean)
    .join(" · ")
  const employment = formatEmployment(entry)
  const tags = entry.tags ?? []

  // Popovers stay rendered (hidden) so they can animate out and so
  // `aria-describedby` always resolves; that also means the popover already
  // has a layout size to measure before it opens. It sits above the bar
  // unless that spot is covered (the sticky header, on phones especially)
  // and below is clear.
  const show = () => {
    const anchor = itemRef.current?.getBoundingClientRect()
    const frame = frameRef.current
    const popover = popoverRef.current
    if (anchor && frame && popover?.offsetWidth) {
      const bounds = frame.getBoundingClientRect()
      const fit = popoverPlacement({
        anchor: { left: anchor.left, width: anchor.width },
        popoverWidth: popover.offsetWidth,
        frame: { left: bounds.left, right: bounds.right },
      })
      const x = anchor.left + fit.offset + fit.caret
      const reach = popover.offsetHeight + PROBE_SLACK_PX
      const above = !isObscured({ x, y: anchor.top - reach, within: frame })
      const below = !isObscured({ x, y: anchor.bottom + reach, within: frame })
      setPlacement({ ...fit, side: above || !below ? "above" : "below" })
    }
    onShow(key)
  }
  const hide = () => onHide(key)

  return (
    <li
      ref={itemRef}
      className={styles.slot}
      data-open={open}
      style={{ left: `${bar.leftPct}%`, width: `${bar.widthPct}%` }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <button
        type="button"
        className={styles.bar}
        aria-label={barName(slot)}
        aria-describedby={popoverId}
        style={{
          animationDelay: `${(bar.leftPct / 100) * SWEEP_MS}ms`,
          animationDuration: `${(bar.widthPct / 100) * SWEEP_MS}ms`,
        }}
        onFocus={show}
        onBlur={hide}
        onClick={show}
      >
        {barText(slot)}
      </button>
      <div
        ref={popoverRef}
        id={popoverId}
        role="tooltip"
        className={styles.popover}
        data-side={placement?.side ?? "above"}
        style={
          placement
            ? {
                left: `${placement.offset}px`,
                transformOrigin: `${placement.caret}px ${placement.side === "above" ? "100%" : "0"}`,
              }
            : undefined
        }
      >
        <p className={styles.popoverRole}>{entry.role}</p>
        <p className={styles.popoverCompany}>{entry.company}</p>
        {meta && <p className={styles.popoverMeta}>{meta}</p>}
        {employment && <p className={styles.popoverMeta}>{employment}</p>}
        {tags.length > 0 && (
          <ul className={styles.popoverTags}>
            {tags.map((tag) => (
              <li key={tag} className={styles.popoverTag}>
                {tag}
              </li>
            ))}
          </ul>
        )}
        <span
          className={styles.caret}
          style={placement ? { left: `${placement.caret}px` } : undefined}
          aria-hidden="true"
        />
      </div>
    </li>
  )
}

// A three-lane Gantt of the whole career: full-time and part-time
// employment above the always-running Codebender side-project track. Each
// bar is a button whose popover (on hover, focus, or tap) names the role,
// dates, tenure, and stack, so even stints too short for a label are
// identifiable; the list below remains the full, zoom-friendly record.
export function CareerMap() {
  const { work_experience } = useStore()
  const baseId = useId()
  const frameRef = useRef<HTMLElement>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  // The last bar shown, kept after it closes so the axis highlight fades
  // out in place instead of jumping.
  const [rangeKey, setRangeKey] = useState<string | null>(null)
  const revealed = useRevealOnView(frameRef)

  // Escape dismisses a hover popover too (WCAG 1.4.13), and a press
  // anywhere outside the open bar closes a tapped one on touch screens.
  useEffect(() => {
    if (!activeKey) return
    const close = () => setActiveKey(null)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    const onPointerDown = (event: PointerEvent) => {
      const open = frameRef.current?.querySelector('[data-open="true"]')
      if (event.target instanceof Node && open?.contains(event.target)) return
      close()
    }
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("pointerdown", onPointerDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [activeKey])

  const tracks = partitionExperience(work_experience)
  const lanes: Lane[] = [
    {
      track: "fullTime",
      label: "Employment",
      slots: toSlots({
        entries: tracks.main.filter((entry) => entry.schedule !== "part-time"),
        track: "fullTime",
      }),
    },
    {
      track: "partTime",
      label: "Part-time",
      slots: toSlots({
        entries: tracks.main.filter((entry) => entry.schedule === "part-time"),
        track: "partTime",
      }),
    },
    {
      track: "side",
      label: "Codebender Inc.",
      slots: toSlots({ entries: tracks.side, track: "side" }),
    },
  ]
  const slots = lanes.flatMap((lane) => lane.slots)

  const range = careerRange(slots.map((slot) => slot.bounds))
  if (!range) return null

  const showSlot = (key: string) => {
    setActiveKey(key)
    setRangeKey(key)
  }
  const hideSlot = (key: string) =>
    setActiveKey((current) => (current === key ? null : current))

  const rangeSlot = slots.find((slot) => slot.key === rangeKey)
  const highlight = rangeSlot
    ? barFor({ bounds: rangeSlot.bounds, range })
    : null

  return (
    <figure
      ref={frameRef}
      className={styles.map}
      aria-labelledby={`${baseId}-title`}
      data-reveal={revealed ? "done" : "pending"}
    >
      <span className={styles.head}>
        <span id={`${baseId}-title`} className={styles.title}>
          Career map
        </span>
        <span className={styles.legend}>
          <span className={styles.key}>
            <span
              className={`${styles.swatch} ${styles.fullTime}`}
              aria-hidden="true"
            />
            Full-time
          </span>
          <span className={styles.key}>
            <span
              className={`${styles.swatch} ${styles.partTime}`}
              aria-hidden="true"
            />
            Part-time contract
          </span>
          <span className={styles.key}>
            <span
              className={`${styles.swatch} ${styles.side}`}
              aria-hidden="true"
            />
            Codebender Inc. (side projects)
          </span>
        </span>
      </span>
      <span className={styles.grid}>
        {lanes.map((lane) => (
          <Fragment key={lane.track}>
            <span
              id={`${baseId}-${lane.track}`}
              className={
                lane.track === "side" ? styles.sideLaneLabel : styles.laneLabel
              }
            >
              {lane.label}
            </span>
            <ol
              className={`${styles.lane} ${TRACK_CLASS[lane.track]}`}
              aria-labelledby={`${baseId}-${lane.track}`}
            >
              {lane.slots.map((slot, index) => (
                <CareerBar
                  key={slot.key}
                  slot={slot}
                  range={range}
                  popoverId={`${baseId}-${lane.track}-${index}`}
                  open={activeKey === slot.key}
                  frameRef={frameRef}
                  onShow={showSlot}
                  onHide={hideSlot}
                />
              ))}
            </ol>
          </Fragment>
        ))}
        <span className={styles.laneLabel} />
        <span className={styles.ticks} aria-hidden="true">
          {rangeSlot && highlight && (
            <span
              className={`${styles.range} ${TRACK_CLASS[rangeSlot.track]}`}
              data-visible={activeKey === rangeSlot.key}
              style={{
                left: `${highlight.leftPct}%`,
                width: `${highlight.widthPct}%`,
              }}
            />
          )}
          {yearTicks({ range }).map((tick) => (
            <span
              key={tick.year}
              className={styles.tick}
              style={{
                left: `${tick.leftPct}%`,
                animationDelay: `${(tick.leftPct / 100) * SWEEP_MS}ms`,
              }}
            >
              {tick.year}
            </span>
          ))}
        </span>
      </span>
    </figure>
  )
}
