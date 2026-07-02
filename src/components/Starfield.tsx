import { useEffect, useMemo, useRef } from "react"

import styles from "@components/Starfield.module.css"

import { makeStars } from "@utils/particles"
import type { StarLayerConfig } from "@utils/particles"

const LAYERS: StarLayerConfig[] = [
  {
    count: 160,
    speed: 0.1,
    sizeRange: [1, 1.6],
    opacityRange: [0.25, 0.6],
    rangeY: 4000,
  },
  {
    count: 80,
    speed: 0.3,
    sizeRange: [1.4, 2.2],
    opacityRange: [0.4, 0.85],
    rangeY: 4000,
  },
  {
    count: 30,
    speed: 0.55,
    sizeRange: [2, 3],
    opacityRange: [0.7, 1],
    rangeY: 4000,
  },
]

export function Starfield() {
  const layers = useMemo(
    () => LAYERS.map((config) => ({ config, stars: makeStars(config) })),
    []
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
    <div className={styles.starfield} aria-hidden="true">
      {layers.map(({ stars }, idx) => (
        <div
          key={idx}
          ref={(el) => {
            layerRefs.current[idx] = el
          }}
          className={styles.layer}
        >
          {stars.map((star, i) => (
            <span
              key={i}
              className={styles.star}
              style={{
                left: `${star.x}%`,
                top: `${star.y}px`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
