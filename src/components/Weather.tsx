import { useEffect, useMemo, useState } from "react"

import { fetchWeather, getWeatherOverride } from "@weather"
import type { Weather as WeatherKind } from "@weather"

import styles from "@components/Weather.module.css"

import { makeDrops } from "@utils/particles"

const RAIN_COUNT = 140
const SNOW_COUNT = 90

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
