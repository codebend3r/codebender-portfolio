import { useEffect, useMemo, useRef } from "react"
import type { CSSProperties } from "react"

import cloudsSprite from "@assets/clouds.png"
import moonSprite from "@assets/moon.png"
import sunSprite from "@assets/sun.png"

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

const SPRITE_GRID = 3
const SPRITE_COUNT = SPRITE_GRID * SPRITE_GRID

type CloudLayerConfig = {
  speed: number
  count: number
  scaleRange: [number, number]
  opacityRange: [number, number]
  driftRange: [number, number]
  driftAmount: number
}

const SUN_VARIANT: Record<DaylightSky, string> = {
  day: styles.sunDay,
  dawn: styles.sunDawn,
  dusk: styles.sunDusk,
}

const SUN_SPRITE_INDEX: Record<DaylightSky, number> = {
  day: 1,
  dawn: 8,
  dusk: 5,
}

const MOON_SPRITE_INDEX = 4

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
      shape: Math.floor(Math.random() * SPRITE_COUNT),
      driftAmount: direction * config.driftAmount,
      driftDuration: minDur + Math.random() * (maxDur - minDur),
      driftDelay: -Math.random() * maxDur,
    })
  }
  return clouds
}

function Moon() {
  const pos = spritePosition(MOON_SPRITE_INDEX)
  return (
    <div className={styles.moon}>
      <div
        className={styles.moonSprite}
        style={{
          backgroundImage: `url(${moonSprite})`,
          backgroundPosition: `${pos.x} ${pos.y}`,
        }}
      />
    </div>
  )
}

function Sun({ kind }: { kind: DaylightSky }) {
  const pos = spritePosition(SUN_SPRITE_INDEX[kind])
  return (
    <div className={`${styles.sun} ${SUN_VARIANT[kind]}`}>
      <div
        className={styles.sunSprite}
        style={{
          backgroundImage: `url(${sunSprite})`,
          backgroundPosition: `${pos.x} ${pos.y}`,
        }}
      />
    </div>
  )
}

function spritePosition(shape: number): { x: string; y: string } {
  const index = ((shape % SPRITE_COUNT) + SPRITE_COUNT) % SPRITE_COUNT
  const col = index % SPRITE_GRID
  const row = Math.floor(index / SPRITE_GRID)
  const step = 100 / (SPRITE_GRID - 1)
  return { x: `${col * step}%`, y: `${row * step}%` }
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
          {clouds.map((cloud, i) => {
            const pos = spritePosition(cloud.shape)
            return (
              <div
                key={i}
                className={styles.cloud}
                style={
                  {
                    left: `${cloud.x}%`,
                    top: `${cloud.y}%`,
                    width: `${200 * cloud.scale}px`,
                    height: `${200 * cloud.scale}px`,
                    opacity: cloud.opacity,
                    animationDuration: `${cloud.driftDuration}s`,
                    animationDelay: `${cloud.driftDelay}s`,
                    "--cloud-drift": `${cloud.driftAmount}vw`,
                  } as CSSProperties
                }
              >
                <div
                  className={styles.cloudSprite}
                  style={{
                    backgroundImage: `url(${cloudsSprite})`,
                    backgroundPosition: `${pos.x} ${pos.y}`,
                    transform: cloud.flip ? "scaleX(-1)" : undefined,
                  }}
                />
              </div>
            )
          })}
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
