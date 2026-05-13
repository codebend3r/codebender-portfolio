import { useEffect, useMemo, useRef } from "react"
import type { CSSProperties } from "react"

import { Starfield } from "@components/Starfield"

import { getCurrentSky } from "@sky"
import type { Sky as SkyName } from "@sky"

import { css, cva } from "@styled-system/css"

type DaylightSky = Exclude<SkyName, "night">

type Cloud = {
  x: number
  y: number
  scale: number
  opacity: number
  flip: boolean
  driftAmount: number
  driftDuration: number
  driftDelay: number
}

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

const CLOUD_LAYERS: CloudLayerConfig[] = [
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
]

const skyStageStyles = css({
  position: "fixed",
  inset: 0,
  zIndex: 0,
  overflow: "hidden",
  pointerEvents: "none",
})

const moonStyles = css({
  position: "absolute",
  top: "8%",
  right: "10%",
  width: "90px",
  height: "90px",
  borderRadius: "50%",
  background: "radial-gradient(circle at 35% 35%, #fdfbf2, #d8d2bf 70%)",
  boxShadow:
    "0 0 50px rgba(255, 250, 220, 0.35), 0 0 110px rgba(180, 200, 255, 0.18), inset -12px -10px 28px rgba(70, 70, 95, 0.4)",
})

const sunStyles = cva({
  base: {
    position: "absolute",
    borderRadius: "50%",
  },
  variants: {
    kind: {
      day: {
        top: "10%",
        right: "12%",
        width: "110px",
        height: "110px",
        background:
          "radial-gradient(circle, #fff7c2 0%, #ffd35a 60%, #ffae3d 100%)",
        boxShadow:
          "0 0 70px rgba(255, 220, 100, 0.6), 0 0 140px rgba(255, 180, 70, 0.35)",
      },
      dawn: {
        top: "62%",
        left: "12%",
        width: "140px",
        height: "140px",
        background:
          "radial-gradient(circle, #ffe9c4 0%, #ffb784 55%, #ff7a89 100%)",
        boxShadow:
          "0 0 90px rgba(255, 154, 158, 0.55), 0 0 180px rgba(255, 122, 137, 0.3)",
      },
      dusk: {
        top: "64%",
        right: "12%",
        width: "140px",
        height: "140px",
        background:
          "radial-gradient(circle, #ffd49b 0%, #ff8a5b 55%, #c84658 100%)",
        boxShadow:
          "0 0 90px rgba(255, 122, 89, 0.6), 0 0 180px rgba(186, 85, 211, 0.3)",
      },
    },
  },
})

const cloudsStyles = css({
  position: "absolute",
  inset: 0,
})

const cloudsLayerStyles = css({
  position: "absolute",
  inset: 0,
  willChange: "transform",
})

const cloudStyles = css({
  position: "absolute",
  filter: "blur(3px)",
  animationName: "cloudDrift",
  animationTimingFunction: "ease-in-out",
  animationIterationCount: "infinite",
  animationDirection: "alternate",
  willChange: "transform",
  "& svg": {
    display: "block",
    width: "100%",
    height: "100%",
  },
})

function makeClouds(config: CloudLayerConfig): Cloud[] {
  const [minScale, maxScale] = config.scaleRange
  const [minOpacity, maxOpacity] = config.opacityRange
  const [minDur, maxDur] = config.driftRange
  const clouds: Cloud[] = []
  for (let i = 0; i < config.count; i++) {
    const direction = Math.random() < 0.5 ? -1 : 1
    clouds.push({
      x: Math.random() * 90,
      y: Math.random() * 45,
      scale: minScale + Math.random() * (maxScale - minScale),
      opacity: minOpacity + Math.random() * (maxOpacity - minOpacity),
      flip: Math.random() < 0.5,
      driftAmount: direction * config.driftAmount,
      driftDuration: minDur + Math.random() * (maxDur - minDur),
      driftDelay: -Math.random() * maxDur,
    })
  }
  return clouds
}

function Moon() {
  return <div className={moonStyles} />
}

function Sun({ kind }: { kind: DaylightSky }) {
  return <div className={sunStyles({ kind })} />
}

function CloudShape({ tint, flip }: { tint: string; flip: boolean }) {
  return (
    <svg
      viewBox="0 0 208 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        fill={tint}
        d="M 60 94 c -16 0 -28 -12 -28 -28 c 0 -16 12 -28 28 -28 c 3 -22 22 -38 44 -38 c 22 0 40 16 44 38 c 16 0 28 12 28 28 c 0 16 -12 28 -28 28 z"
      />
    </svg>
  )
}

function Clouds({ kind }: { kind: DaylightSky }) {
  const layers = useMemo(
    () =>
      CLOUD_LAYERS.map((config) => ({ config, clouds: makeClouds(config) })),
    []
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
    <div className={cloudsStyles}>
      {layers.map(({ clouds }, idx) => (
        <div
          key={idx}
          ref={(el) => {
            layerRefs.current[idx] = el
          }}
          className={cloudsLayerStyles}
        >
          {clouds.map((cloud, i) => (
            <div
              key={i}
              className={cloudStyles}
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
              <CloudShape tint={tint} flip={cloud.flip} />
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
      <div className={skyStageStyles} aria-hidden="true">
        <Starfield />
        <Moon />
      </div>
    )
  }

  return (
    <div className={skyStageStyles} aria-hidden="true">
      <Sun kind={sky} />
      <Clouds kind={sky} />
    </div>
  )
}
