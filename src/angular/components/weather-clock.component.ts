import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from "@angular/core"

import { fetchWeatherDetails } from "@weather"
import type { WeatherCondition, WeatherDetails } from "@weather"

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

@Component({
  selector: "app-weather-clock",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./weather-clock.component.css",
  template: `
    <div class="panel" aria-label="Local weather and time">
      @if (weatherView(); as weather) {
        <div class="weather">
          <span aria-hidden="true">{{ weather.icon }}</span>
          {{ weather.temperature }}°C
        </div>
      }
      <div class="date">{{ dateText() }}</div>
      <div class="time">{{ timeText() }}</div>
    </div>
  `,
})
export class WeatherClockComponent {
  private readonly details = signal<WeatherDetails | null>(null)
  private readonly now = signal(new Date())

  readonly weatherView = computed(() => {
    const details = this.details()
    if (!details) return null
    return {
      icon: CONDITION_ICON[details.condition],
      temperature: Math.round(details.temperature),
    }
  })

  readonly dateText = computed(() =>
    this.now().toLocaleDateString(undefined, DATE_FORMAT)
  )

  readonly timeText = computed(() =>
    this.now().toLocaleTimeString(undefined, TIME_FORMAT)
  )

  constructor() {
    const destroyRef = inject(DestroyRef)

    let cancelled = false
    destroyRef.onDestroy(() => {
      cancelled = true
    })
    void fetchWeatherDetails().then((result) => {
      if (!cancelled) this.details.set(result)
    })

    const id = window.setInterval(() => this.now.set(new Date()), 60_000)
    destroyRef.onDestroy(() => window.clearInterval(id))
  }
}
