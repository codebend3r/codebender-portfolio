import { useEffect, useState } from "react"

import styles from "@components/WeatherClock.module.css"

import { fetchWeatherDetails } from "@weather"
import type { WeatherCondition, WeatherDetails } from "@weather"

// Only precipitation earns a word next to the temperature; calm conditions
// read as just "18°C", matching the v2 header mock.
const CONDITION_LABEL: Partial<Record<WeatherCondition, string>> = {
  rain: "Rain",
  snow: "Snow",
  storm: "Storm",
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
}

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
}

function weatherLabel(details: WeatherDetails): string {
  const label = CONDITION_LABEL[details.condition] ?? null
  const temperature = `${Math.round(details.temperature)}°C`
  return label ? `${temperature} · ${label}` : temperature
}

export function WeatherClock() {
  const [details, setDetails] = useState<WeatherDetails | null>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let cancelled = false
    void fetchWeatherDetails().then((result) => {
      if (!cancelled) setDetails(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className={styles.panel} aria-label="Local weather and time">
      <div className={styles.date}>
        {now.toLocaleDateString(undefined, DATE_FORMAT)}
      </div>
      <div className={styles.time}>
        {now.toLocaleTimeString(undefined, TIME_FORMAT)}
      </div>
      {details && <div className={styles.weather}>{weatherLabel(details)}</div>}
    </div>
  )
}
