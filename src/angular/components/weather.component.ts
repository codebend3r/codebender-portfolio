import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core"
import { fetchWeather, getWeatherOverride } from "@weather"
import type { Weather as WeatherKind } from "@weather"

import { makeDrops } from "@utils/particles"

const RAIN_COUNT = 140
const SNOW_COUNT = 90

@Component({
  selector: "app-weather",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./weather.component.css",
  template: `
    @if (weather() === "rain") {
      <div class="weather" aria-hidden="true">
        @for (drop of drops; track $index) {
          <span
            class="raindrop"
            [style.left.%]="drop.left"
            [style.animation-delay.s]="drop.delay"
            [style.animation-duration.s]="drop.duration"
            [style.opacity]="drop.opacity"
            [style.transform]="'scaleY(' + drop.scale + ')'"
          ></span>
        }
      </div>
    } @else if (weather() === "snow") {
      <div class="weather" aria-hidden="true">
        @for (flake of flakes; track $index) {
          <span
            class="snowflake"
            [style.left.%]="flake.left"
            [style.animation-delay.s]="flake.delay"
            [style.animation-duration.s]="flake.duration"
            [style.opacity]="flake.opacity"
            [style.width.px]="6 * flake.scale"
            [style.height.px]="6 * flake.scale"
          ></span>
        }
      </div>
    }
  `,
})
export class WeatherComponent {
  readonly drops = makeDrops(RAIN_COUNT, [0.45, 1.1])
  readonly flakes = makeDrops(SNOW_COUNT, [6, 14])

  private readonly override = getWeatherOverride()
  readonly weather = signal<WeatherKind>(this.override ?? "none")

  constructor() {
    if (this.override) return

    let cancelled = false
    inject(DestroyRef).onDestroy(() => {
      cancelled = true
    })
    void fetchWeather().then((result) => {
      if (!cancelled) this.weather.set(result)
    })
  }
}
