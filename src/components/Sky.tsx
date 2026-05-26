import { useEffect, useId, useMemo, useRef } from "react"
import type { CSSProperties } from "react"

import { Starfield } from "@components/Starfield"

import { getCurrentSky } from "@sky"
import type { Sky as SkyName } from "@sky"

import styles from "./Sky.module.css"

type DaylightSky = Exclude<SkyName, "night">

type Cloud = {
  x: number
  y: number
  scale: number
  opacity: number
  flip: boolean
  shape: number
  driftAmount: number
  driftDuration: number
  driftDelay: number
}

type Circle = { cx: number; cy: number; r: number }

const CLOUD_SHAPES: Circle[][] = [
  // 1. Classic three-bump
  [
    { cx: 50, cy: 70, r: 26 },
    { cx: 104, cy: 50, r: 42 },
    { cx: 162, cy: 70, r: 26 },
  ],
  // 2. Tall cumulus
  [
    { cx: 50, cy: 75, r: 22 },
    { cx: 104, cy: 45, r: 42 },
    { cx: 158, cy: 75, r: 22 },
  ],
  // 3. Wide stratus (flat, low)
  [
    { cx: 25, cy: 75, r: 18 },
    { cx: 65, cy: 70, r: 22 },
    { cx: 104, cy: 68, r: 24 },
    { cx: 144, cy: 70, r: 22 },
    { cx: 184, cy: 75, r: 18 },
  ],
  // 4. Two-puff
  [
    { cx: 70, cy: 60, r: 35 },
    { cx: 140, cy: 65, r: 30 },
  ],
  // 5. Big puff with smaller companion
  [
    { cx: 80, cy: 55, r: 42 },
    { cx: 145, cy: 75, r: 20 },
  ],
  // 6. Multi-lobe row
  [
    { cx: 30, cy: 70, r: 18 },
    { cx: 70, cy: 60, r: 22 },
    { cx: 110, cy: 55, r: 24 },
    { cx: 145, cy: 60, r: 22 },
    { cx: 180, cy: 70, r: 18 },
  ],
  // 7. Single round blob
  [{ cx: 104, cy: 55, r: 45 }],
  // 8. Asymmetric, taller right
  [
    { cx: 55, cy: 75, r: 20 },
    { cx: 100, cy: 60, r: 28 },
    { cx: 150, cy: 42, r: 36 },
  ],
  // 9. Lumpy three-tier
  [
    { cx: 50, cy: 65, r: 30 },
    { cx: 110, cy: 75, r: 18 },
    { cx: 155, cy: 55, r: 32 },
  ],
  // 10. Wispy elongated
  [
    { cx: 25, cy: 75, r: 14 },
    { cx: 55, cy: 72, r: 18 },
    { cx: 90, cy: 70, r: 16 },
    { cx: 125, cy: 68, r: 18 },
    { cx: 160, cy: 70, r: 14 },
    { cx: 190, cy: 75, r: 12 },
  ],
]

type CloudLayerConfig = {
  speed: number
  count: number
  scaleRange: [number, number]
  opacityRange: [number, number]
  driftRange: [number, number]
  driftAmount: number
}

const CLOUD_TINT: Record<DaylightSky, string> = {
  day: "rgba(255, 255, 255, 0.85)",
  dawn: "rgba(255, 220, 232, 0.78)",
  dusk: "rgba(255, 198, 178, 0.75)",
}

const SUN_VARIANT: Record<DaylightSky, string> = {
  day: styles.sunDay,
  dawn: styles.sunDawn,
  dusk: styles.sunDusk,
}

const CLOUD_LAYERS: Record<DaylightSky, CloudLayerConfig[]> = {
  day: [
    {
      speed: 0.06,
      count: 7,
      scaleRange: [0.55, 0.95],
      opacityRange: [0.4, 0.7],
      driftRange: [160, 240],
      driftAmount: 5,
    },
    {
      speed: 0.14,
      count: 5,
      scaleRange: [0.9, 1.5],
      opacityRange: [0.7, 1],
      driftRange: [110, 180],
      driftAmount: 7,
    },
  ],
  dawn: [
    {
      speed: 0.06,
      count: 5,
      scaleRange: [0.55, 0.95],
      opacityRange: [0.4, 0.7],
      driftRange: [160, 240],
      driftAmount: 5,
    },
    {
      speed: 0.14,
      count: 4,
      scaleRange: [0.9, 1.5],
      opacityRange: [0.7, 1],
      driftRange: [110, 180],
      driftAmount: 7,
    },
  ],
  dusk: [
    {
      speed: 0.06,
      count: 5,
      scaleRange: [0.55, 0.95],
      opacityRange: [0.4, 0.7],
      driftRange: [160, 240],
      driftAmount: 5,
    },
    {
      speed: 0.14,
      count: 4,
      scaleRange: [0.9, 1.5],
      opacityRange: [0.7, 1],
      driftRange: [110, 180],
      driftAmount: 7,
    },
  ],
}

function makeClouds(config: CloudLayerConfig): Cloud[] {
  const [minScale, maxScale] = config.scaleRange
  const [minOpacity, maxOpacity] = config.opacityRange
  const [minDur, maxDur] = config.driftRange
  const clouds: Cloud[] = []
  for (let i = 0; i < config.count; i++) {
    const direction = Math.random() < 0.5 ? -1 : 1
    clouds.push({
      x: Math.random() * 90,
      y: Math.random() * 90,
      scale: minScale + Math.random() * (maxScale - minScale),
      opacity: minOpacity + Math.random() * (maxOpacity - minOpacity),
      flip: Math.random() < 0.5,
      shape: Math.floor(Math.random() * CLOUD_SHAPES.length),
      driftAmount: direction * config.driftAmount,
      driftDuration: minDur + Math.random() * (maxDur - minDur),
      driftDelay: -Math.random() * maxDur,
    })
  }
  return clouds
}

function Moon() {
  return <div className={styles.moon} />
}

function Sun({ kind }: { kind: DaylightSky }) {
  return <div className={`${styles.sun} ${SUN_VARIANT[kind]}`} />
}

function CloudShape({
  tint,
  flip,
  shape,
}: {
  tint: string
  flip: boolean
  shape: number
}) {
  const filterId = useId()
  const circles = CLOUD_SHAPES[shape % CLOUD_SHAPES.length]
  return (
    <svg
      viewBox="0 0 208 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <defs>
        <filter id={filterId}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        {circles.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={tint} />
        ))}
      </g>
    </svg>
  )
}

function Clouds({ kind }: { kind: DaylightSky }) {
  const layers = useMemo(
    () =>
      CLOUD_LAYERS[kind].map((config) => ({
        config,
        clouds: makeClouds(config),
      })),
    [kind]
  )
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const tint = CLOUD_TINT[kind]

  useEffect(() => {
    let raf = 0
    let pending = false

    const update = () => {
      const y = window.scrollY
      for (let i = 0; i < layers.length; i++) {
        const el = layerRefs.current[i]
        if (el) {
          el.style.transform = `translate3d(0, ${-y * layers[i].config.speed}px, 0)`
        }
      }
      pending = false
    }

    const onScroll = () => {
      if (pending) return
      pending = true
      raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [layers])

  return (
    <div className={styles.clouds}>
      {layers.map(({ clouds }, idx) => (
        <div
          key={idx}
          ref={(el) => {
            layerRefs.current[idx] = el
          }}
          className={styles.cloudsLayer}
        >
          {clouds.map((cloud, i) => (
            <div
              key={i}
              className={styles.cloud}
              style={
                {
                  left: `${cloud.x}%`,
                  top: `${cloud.y}%`,
                  width: `${220 * cloud.scale}px`,
                  height: `${88 * cloud.scale}px`,
                  opacity: cloud.opacity,
                  animationDuration: `${cloud.driftDuration}s`,
                  animationDelay: `${cloud.driftDelay}s`,
                  "--cloud-drift": `${cloud.driftAmount}vw`,
                } as CSSProperties
              }
            >
              <CloudShape tint={tint} flip={cloud.flip} shape={cloud.shape} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function Sky() {
  const sky = useMemo(() => getCurrentSky(), [])

  if (sky === "night") {
    return (
      <div className={styles.skyStage} aria-hidden="true">
        <Starfield />
        <Moon />
      </div>
    )
  }

  return (
    <div className={styles.skyStage} aria-hidden="true">
      <Sun kind={sky} />
      <Clouds kind={sky} />
    </div>
  )
}
