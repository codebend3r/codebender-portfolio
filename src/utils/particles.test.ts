import { describe, expect, it, vi } from "vitest"

import { makeClouds, makeDrops, makeStars } from "@utils/particles"
import type { CloudLayerConfig, StarLayerConfig } from "@utils/particles"
import { SPRITE_COUNT } from "@utils/spriteSheet"

const CLOUD_CONFIG: CloudLayerConfig = {
  speed: 0.1,
  count: 6,
  scaleRange: [0.5, 1.5],
  opacityRange: [0.2, 0.8],
  driftRange: [100, 200],
  driftAmount: 5,
}

const STAR_CONFIG: StarLayerConfig = {
  count: 8,
  speed: 0.3,
  sizeRange: [1, 3],
  opacityRange: [0.25, 1],
  rangeY: 4000,
}

describe("makeClouds", () => {
  it("creates the configured number of clouds", () => {
    expect(makeClouds(CLOUD_CONFIG)).toHaveLength(CLOUD_CONFIG.count)
  })

  it("keeps every cloud within the configured ranges", () => {
    for (const cloud of makeClouds(CLOUD_CONFIG)) {
      expect(cloud.x).toBeGreaterThanOrEqual(0)
      expect(cloud.x).toBeLessThan(90)
      expect(cloud.y).toBeGreaterThanOrEqual(0)
      expect(cloud.y).toBeLessThan(90)
      expect(cloud.scale).toBeGreaterThanOrEqual(0.5)
      expect(cloud.scale).toBeLessThan(1.5)
      expect(cloud.opacity).toBeGreaterThanOrEqual(0.2)
      expect(cloud.opacity).toBeLessThan(0.8)
      expect(Math.abs(cloud.driftAmount)).toBe(5)
      expect(cloud.driftDuration).toBeGreaterThanOrEqual(100)
      expect(cloud.driftDuration).toBeLessThan(200)
      expect(cloud.driftDelay).toBeLessThanOrEqual(0)
      expect(cloud.driftDelay).toBeGreaterThanOrEqual(-200)
      expect(Number.isInteger(cloud.shape)).toBe(true)
      expect(cloud.shape).toBeGreaterThanOrEqual(0)
      expect(cloud.shape).toBeLessThan(SPRITE_COUNT)
      expect(typeof cloud.flip).toBe("boolean")
    }
  })

  it("derives deterministic values from the random source", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5)
    const [cloud] = makeClouds({ ...CLOUD_CONFIG, count: 1 })
    expect(cloud.x).toBe(45)
    expect(cloud.y).toBe(45)
    expect(cloud.scale).toBeCloseTo(1)
    expect(cloud.opacity).toBeCloseTo(0.5)
    expect(cloud.flip).toBe(false)
    expect(cloud.shape).toBe(Math.floor(0.5 * SPRITE_COUNT))
    expect(cloud.driftAmount).toBe(5)
    expect(cloud.driftDuration).toBe(150)
    expect(cloud.driftDelay).toBe(-100)
  })
})

describe("makeStars", () => {
  it("creates the configured number of stars", () => {
    expect(makeStars(STAR_CONFIG)).toHaveLength(STAR_CONFIG.count)
  })

  it("keeps every star within the configured ranges", () => {
    for (const star of makeStars(STAR_CONFIG)) {
      expect(star.x).toBeGreaterThanOrEqual(0)
      expect(star.x).toBeLessThan(100)
      expect(star.y).toBeGreaterThanOrEqual(0)
      expect(star.y).toBeLessThan(STAR_CONFIG.rangeY)
      expect(star.size).toBeGreaterThanOrEqual(1)
      expect(star.size).toBeLessThan(3)
      expect(star.opacity).toBeGreaterThanOrEqual(0.25)
      expect(star.opacity).toBeLessThan(1)
    }
  })

  it("derives deterministic values from the random source", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5)
    const [star] = makeStars({ ...STAR_CONFIG, count: 1 })
    expect(star.x).toBe(50)
    expect(star.y).toBe(2000)
    expect(star.size).toBeCloseTo(2)
    expect(star.opacity).toBeCloseTo(0.625)
  })
})

describe("makeDrops", () => {
  it("creates the requested number of drops", () => {
    expect(makeDrops(12, [6, 14])).toHaveLength(12)
  })

  it("keeps every drop within the configured ranges", () => {
    for (const drop of makeDrops(30, [6, 14])) {
      expect(drop.left).toBeGreaterThanOrEqual(0)
      expect(drop.left).toBeLessThan(100)
      expect(drop.delay).toBeLessThanOrEqual(0)
      expect(drop.delay).toBeGreaterThanOrEqual(-14)
      expect(drop.duration).toBeGreaterThanOrEqual(6)
      expect(drop.duration).toBeLessThan(14)
      expect(drop.opacity).toBeGreaterThanOrEqual(0.4)
      expect(drop.opacity).toBeLessThan(1)
      expect(drop.scale).toBeGreaterThanOrEqual(0.6)
      expect(drop.scale).toBeLessThan(1.5)
    }
  })

  it("derives deterministic values from the random source", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5)
    const [drop] = makeDrops(1, [6, 14])
    expect(drop.left).toBe(50)
    expect(drop.delay).toBe(-7)
    expect(drop.duration).toBe(10)
    expect(drop.opacity).toBeCloseTo(0.7)
    expect(drop.scale).toBeCloseTo(1.05)
  })
})
