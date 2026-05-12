import { useMemo } from "react"

import { Starfield } from "@components/Starfield"

import { getCurrentSky } from "../sky"
import type { Sky as SkyName } from "../sky"

type DaylightSky = Exclude<SkyName, "night">

type Cloud = {
  x: number
  y: number
  scale: number
  opacity: number
  flip: boolean
}

const CLOUD_TINT: Record<DaylightSky, string> = {
  day: "rgba(255, 255, 255, 0.85)",
  dawn: "rgba(255, 220, 232, 0.78)",
  dusk: "rgba(255, 198, 178, 0.75)",
}

function makeClouds(count: number): Cloud[] {
  const clouds: Cloud[] = []
  for (let i = 0; i < count; i++) {
    clouds.push({
      x: Math.random() * 90,
      y: Math.random() * 45,
      scale: 0.7 + Math.random() * 0.9,
      opacity: 0.55 + Math.random() * 0.45,
      flip: Math.random() < 0.5,
    })
  }
  return clouds
}

function Moon() {
  return <div className="moon" />
}

function Sun({ kind }: { kind: DaylightSky }) {
  return <div className={`sun sun--${kind}`} />
}

function CloudShape({ tint }: { tint: string }) {
  return (
    <svg
      viewBox="0 0 208 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      <path
        fill={tint}
        d="M 60 94 c -16 0 -28 -12 -28 -28 c 0 -16 12 -28 28 -28 c 3 -22 22 -38 44 -38 c 22 0 40 16 44 38 c 16 0 28 12 28 28 c 0 16 -12 28 -28 28 z"
      />
    </svg>
  )
}

function Clouds({ kind }: { kind: DaylightSky }) {
  const clouds = useMemo(() => makeClouds(8), [])
  const tint = CLOUD_TINT[kind]

  return (
    <div className="clouds">
      {clouds.map((cloud, i) => (
        <div
          key={i}
          className="cloud"
          style={{
            left: `${cloud.x}%`,
            top: `${cloud.y}%`,
            width: `${220 * cloud.scale}px`,
            height: `${88 * cloud.scale}px`,
            opacity: cloud.opacity,
            transform: cloud.flip ? "scaleX(-1)" : undefined,
          }}
        >
          <CloudShape tint={tint} />
        </div>
      ))}
    </div>
  )
}

export function Sky() {
  const sky = useMemo(() => getCurrentSky(), [])

  if (sky === "night") {
    return (
      <div className="sky-stage" aria-hidden="true">
        <Starfield />
        <Moon />
      </div>
    )
  }

  return (
    <div className="sky-stage" aria-hidden="true">
      <Sun kind={sky} />
      <Clouds kind={sky} />
    </div>
  )
}
