import { Fragment } from "react"

import styles from "@components/CareerMap.module.css"

import { useStore } from "@state/useStore"

import { barFor, careerRange, periodBounds, yearTicks } from "@utils/careerMap"
import type { CareerRange, PeriodBounds } from "@utils/careerMap"
import { partitionExperience } from "@utils/employment"

type Slot = {
  entry: Experience
  bounds: PeriodBounds
}

const toSlots = (entries: readonly Experience[]): Slot[] =>
  entries.flatMap((entry) => {
    const bounds = periodBounds(entry.period)
    return bounds ? [{ entry, bounds }] : []
  })

function Lane({
  label,
  labelClass,
  slots,
  range,
  barClass,
  sideLabel = false,
}: {
  label: string
  labelClass?: string
  slots: Slot[]
  range: CareerRange
  barClass: string
  sideLabel?: boolean
}) {
  return (
    <Fragment>
      <span className={labelClass ?? styles.laneLabel}>{label}</span>
      <span className={styles.lane}>
        {slots.map(({ entry, bounds }) => {
          const bar = barFor(bounds, range)
          const text = sideLabel
            ? `Side projects · ${Math.floor(bounds.start)} → now`
            : (entry.short ?? "")
          return (
            <span
              key={`${entry.company}-${entry.period}`}
              className={`${styles.bar} ${barClass}`}
              style={{ left: `${bar.leftPct}%`, width: `${bar.widthPct}%` }}
              title={`${entry.company} · ${entry.period}`}
            >
              {text}
            </span>
          )
        })}
      </span>
    </Fragment>
  )
}

// A three-lane Gantt of the whole career: full-time and part-time
// employment above the always-running Codebender side-project track. It
// visualizes the list below it, so screen readers get the list instead.
export function CareerMap() {
  const { work_experience } = useStore()
  const tracks = partitionExperience(work_experience)
  const fullTime = toSlots(
    tracks.main.filter((entry) => entry.schedule !== "part-time")
  )
  const partTime = toSlots(
    tracks.main.filter((entry) => entry.schedule === "part-time")
  )
  const side = toSlots(tracks.side)

  const range = careerRange(
    [...fullTime, ...partTime, ...side].map((slot) => slot.bounds)
  )
  if (!range) return null

  return (
    <figure className={styles.map} aria-hidden="true">
      <span className={styles.head}>
        <span className={styles.title}>Career map</span>
        <span className={styles.legend}>
          <span className={styles.key}>
            <span className={`${styles.swatch} ${styles.fullTime}`} />
            Full-time
          </span>
          <span className={styles.key}>
            <span className={`${styles.swatch} ${styles.partTime}`} />
            Part-time contract
          </span>
          <span className={styles.key}>
            <span className={`${styles.swatch} ${styles.side}`} />
            Codebender Inc. (side projects)
          </span>
        </span>
      </span>
      <span className={styles.grid}>
        <Lane
          label="Employment"
          slots={fullTime}
          range={range}
          barClass={styles.fullTime}
        />
        <Lane
          label="Part-time"
          slots={partTime}
          range={range}
          barClass={styles.partTime}
        />
        <Lane
          label="Codebender Inc."
          labelClass={styles.sideLaneLabel}
          slots={side}
          range={range}
          barClass={styles.side}
          sideLabel
        />
        <span className={styles.laneLabel} />
        <span className={styles.ticks}>
          {yearTicks(range).map((tick) => (
            <span
              key={tick.year}
              className={styles.tick}
              style={{ left: `${tick.leftPct}%` }}
            >
              {tick.year}
            </span>
          ))}
        </span>
      </span>
    </figure>
  )
}
