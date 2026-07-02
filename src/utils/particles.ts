import { SPRITE_COUNT } from "@utils/spriteSheet"

export type Cloud = {
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

export type CloudLayerConfig = {
  speed: number
  count: number
  scaleRange: [number, number]
  opacityRange: [number, number]
  driftRange: [number, number]
  driftAmount: number
}

export type Star = {
  x: number
  y: number
  size: number
  opacity: number
}

export type StarLayerConfig = {
  count: number
  speed: number
  sizeRange: [number, number]
  opacityRange: [number, number]
  rangeY: number
}

export type Drop = {
  left: number
  delay: number
  duration: number
  opacity: number
  scale: number
}

export function makeClouds(config: CloudLayerConfig): Cloud[] {
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

export function makeStars(config: StarLayerConfig): Star[] {
  const [minSize, maxSize] = config.sizeRange
  const [minOpacity, maxOpacity] = config.opacityRange
  const stars: Star[] = []
  for (let i = 0; i < config.count; i++) {
    stars.push({
      x: Math.random() * 100,
      y: Math.random() * config.rangeY,
      size: minSize + Math.random() * (maxSize - minSize),
      opacity: minOpacity + Math.random() * (maxOpacity - minOpacity),
    })
  }
  return stars
}

export function makeDrops(
  count: number,
  durationRange: [number, number]
): Drop[] {
  const [minDur, maxDur] = durationRange
  const drops: Drop[] = []
  for (let i = 0; i < count; i++) {
    drops.push({
      left: Math.random() * 100,
      delay: -Math.random() * maxDur,
      duration: minDur + Math.random() * (maxDur - minDur),
      opacity: 0.4 + Math.random() * 0.6,
      scale: 0.6 + Math.random() * 0.9,
    })
  }
  return drops
}
