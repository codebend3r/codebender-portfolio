# Weather + date + time indicator (top-left panel)

**Status:** Design — approved.
**Date:** 2026-05-26

## Motivation

The page has rain/snow particle effects driven by real weather, but no textual indicator of what the actual conditions, date, or time are. Add a small fixed panel at the top-left that mirrors the existing top-right "Download PDF" button: condition + temperature, formatted date, and a live clock.

## Goals

- Show current condition (icon) + temperature, formatted date, and a live 12h clock — three rows, top-left of viewport.
- Reuse the existing Open-Meteo `current_weather` call (one round-trip).
- Mirror the visual weight of the top-right Download PDF button so the page feels balanced.
- Keep `Weather.tsx` (particle effects) untouched — strictly additive.

## Non-goals

- Wind, humidity, multi-day forecast.
- A draggable / collapsible panel.
- Manual location entry, location label ("Mississauga"), 24h toggle.
- Server-side rendering concerns (the site is purely client-side).

## Architecture

### Data layer — extend `src/weather.ts`

Add a new `fetchWeatherDetails()` alongside the existing `fetchWeather()`. Existing function continues to return `"rain" | "snow" | "none"` for the particle component — no signature change, no caller updates required.

```ts
export type WeatherCondition =
  | "clear"
  | "cloudy"
  | "rain"
  | "snow"
  | "storm"
  | "unknown"

export type WeatherDetails = {
  condition: WeatherCondition
  temperature: number
}

export async function fetchWeatherDetails(): Promise<WeatherDetails | null>
```

Returns `null` on geolocation denial, network failure, or missing fields. The new function reuses the existing `requestPosition()` helper.

`weathercode` → `WeatherCondition` mapping (WMO codes per Open-Meteo docs):

| Code          | Condition                    |
| ------------- | ---------------------------- |
| 0             | clear                        |
| 1, 2, 3       | cloudy                       |
| 45, 48        | cloudy (fog → cloudy bucket) |
| 51–67, 80–82  | rain                         |
| 71–77, 85–86  | snow                         |
| 95, 96, 99    | storm                        |
| anything else | unknown                      |

### Component — `src/components/WeatherClock.tsx`

```tsx
function WeatherClock() {
  const [details, setDetails] = useState<WeatherDetails | null>(null)
  const [now, setNow] = useState(() => new Date())

  // fetch once on mount
  // tick every 60s
}
```

- Fetch weather details once on mount; ignore errors (just leave the weather row hidden).
- Clock state: `setInterval(() => setNow(new Date()), 60_000)`; clear on unmount.
- Render three rows:
  1. `${conditionIcon[condition]} ${Math.round(temperature)}°C` — hidden if details are null
  2. Date: `toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })`
  3. Time: `toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })`

`conditionIcon` is a small `Record<WeatherCondition, string>` of emoji: `☀️ ☁️ 🌧️ ❄️ ⛈️ ❓`.

### Style — `src/components/WeatherClock.module.css`

- `position: fixed; top: 16px; left: 16px; z-index: 10` — symmetric with the Download PDF wrapper.
- `padding: 8px 12px; border-radius: 8px; border: 2px solid var(--accent); background: var(--bg); color: var(--text);` — visually paired with the download button.
- Three flex rows, `gap: 4px`, font-size matching the Download PDF (`14–16px` for weather/time, slightly smaller `12px` muted for date).
- Date row uses `color: var(--muted)`.
- `@media print { display: none }` — same handling as `.hoverButton`.

### Mount — `src/App.tsx`

```tsx
<Sky />
<Weather />
<WeatherClock />
{/* … */}
```

## Failure modes

- Geolocation denied → `requestPosition()` rejects → `fetchWeatherDetails()` returns `null` → weather row hidden; date + time still render.
- Open-Meteo unreachable / non-OK response → same: returns `null`.
- Clock relies only on `Date` — no network — and is always shown.

## Tests

- Extend `src/weather.test.ts` with cases covering the new `weathercode` → `WeatherCondition` mapping (one assertion per bucket: clear, cloudy, fog→cloudy, rain, snow, storm, unknown).
- New `src/components/WeatherClock.test.tsx`:
  - Renders date + time when `fetchWeatherDetails` resolves `null` (geolocation denied).
  - Renders weather row + date + time when the fetch resolves with a payload (mock with `vi.mock` of `@weather`).
  - With `vi.useFakeTimers()`, advance 60s and assert the time text re-renders.

## Commit plan

1. Extend `src/weather.ts` + `src/weather.test.ts` with `fetchWeatherDetails` and the condition mapping.
2. Add `WeatherClock.tsx` + `WeatherClock.module.css` + `WeatherClock.test.tsx`.
3. Mount `<WeatherClock />` in `App.tsx`.

Each step is its own commit per the project's commit-after-every-change policy.
