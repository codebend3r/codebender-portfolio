import { useEffect, useState } from "react"

import { fetchWeatherDetails } from "@weather"
import type { WeatherCondition, WeatherDetails } from "@weather"

import styles from "./WeatherClock.module.css"

const CONDITION_ICON: Record<WeatherCondition, string> = {
  clear: "☀️",
  cloudy: "☁️",
  rain: "🌧️",
  snow: "❄️",
  storm: "⛈️",
  unknown: "❓",
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

export function WeatherClock() {
  const [details, setDetails] = useState<WeatherDetails | null>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let cancelled = false
    fetchWeatherDetails().then((result) => {
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
      {details && (
        <div className={styles.weather}>
          <span aria-hidden="true">{CONDITION_ICON[details.condition]}</span>{" "}
          {Math.round(details.temperature)}°C
        </div>
      )}
      <div className={styles.date}>
        {now.toLocaleDateString(undefined, DATE_FORMAT)}
      </div>
      <div className={styles.time}>
        {now.toLocaleTimeString(undefined, TIME_FORMAT)}
      </div>
    </div>
  )
}
