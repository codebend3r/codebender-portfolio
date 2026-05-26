import { useEffect, useMemo, useState } from "react"

import { fetchWeather, getWeatherOverride } from "@weather"
import type { Weather as WeatherKind } from "@weather"

import styles from "./Weather.module.css"

type Drop = {
  left: number
  delay: number
  duration: number
  opacity: number
  scale: number
}

const RAIN_COUNT = 140
const SNOW_COUNT = 90

function makeDrops(count: number, durationRange: [number, number]): Drop[] {
  const [minDur, maxDur] = durationRange
  const drops: Drop[] = []
  for (let i = 0; i < count; i++) {
    drops.push({
      left: Math.random() * 100,
      delay: -Math.random() * maxDur,
      duration: minDur + Math.random() * (maxDur - minDur),
      opacity: 0.4 + Math.random() * 0.6,
      scale: 0.6 + Math.random() * 0.9,
    })
  }
  return drops
}

function Rain() {
  const drops = useMemo(() => makeDrops(RAIN_COUNT, [0.45, 1.1]), [])
  return (
    <div className={styles.weather} aria-hidden="true">
      {drops.map((d, i) => (
        <span
          key={i}
          className={styles.raindrop}
          style={{
            left: `${d.left}%`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            opacity: d.opacity,
            transform: `scaleY(${d.scale})`,
          }}
        />
      ))}
    </div>
  )
}

function Snow() {
  const flakes = useMemo(() => makeDrops(SNOW_COUNT, [6, 14]), [])
  return (
    <div className={styles.weather} aria-hidden="true">
      {flakes.map((f, i) => (
        <span
          key={i}
          className={styles.snowflake}
          style={{
            left: `${f.left}%`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
            opacity: f.opacity,
            width: `${6 * f.scale}px`,
            height: `${6 * f.scale}px`,
          }}
        />
      ))}
    </div>
  )
}

export function Weather() {
  const override = useMemo(() => getWeatherOverride(), [])
  const [weather, setWeather] = useState<WeatherKind>(override ?? "none")

  useEffect(() => {
    if (override) return
    let cancelled = false
    fetchWeather().then((result) => {
      if (!cancelled) setWeather(result)
    })
    return () => {
      cancelled = true
    }
  }, [override])

  if (weather === "rain") return <Rain />
  if (weather === "snow") return <Snow />
  return null
}
