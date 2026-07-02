import { useEffect, useMemo, useRef } from "react"
import type { CSSProperties } from "react"

import cloudsSprite from "@assets/clouds.png"
import moonSprite from "@assets/moon.png"
import sunSprite from "@assets/sun.png"

import styles from "@components/Sky.module.css"
import { Starfield } from "@components/Starfield"

import { getCurrentSky } from "@sky"
import type { Sky as SkyName } from "@sky"

import { makeClouds } from "@utils/particles"
import type { CloudLayerConfig } from "@utils/particles"
import { spritePosition } from "@utils/spriteSheet"

type DaylightSky = Exclude<SkyName, "night">

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
