type Star = {
  x: number // base x (0..w)
  y: number // base y (0..h)
  z: number // depth (0..1), lower is farther
  r: number // radius in CSS pixels before DPR scale
  tw: number // twinkle phase 0..2π
  tSpeed: number // twinkle speed
}

const canvas = document.getElementById("starfield") as HTMLCanvasElement
const ctx = canvas.getContext("2d", { alpha: true }) as CanvasRenderingContext2D

let dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
let width = 0
let height = 0

const stars: Star[] = []
const STAR_DENSITY = 0.6 // per 1000 px^2 within hero
const MAX_RADIUS = 1.35 // base radius in CSS px
const PARALLAX_STRENGTH = 0.08 // px per scroll px at z=1
const OPACITY_BASE = 0.05 // barely visible at top
const OPACITY_GAIN = 0.12 // extra opacity unlocked by scrolling
const SCROLL_RANGE = 240 // px of scroll to reach most of the gain

let needsRedraw = true
let lastKnownScrollY = 0
let currentScrollY = 0

function resize() {
  const rect = canvas.getBoundingClientRect()
  width = Math.max(1, Math.floor(rect.width))
  height = Math.max(1, Math.floor(rect.height))

  dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  regenerate()
  needsRedraw = true
}

function regenerate() {
  stars.length = 0
  // number of stars proportional to area
  const areaK = (width * height) / 1000
  const count = Math.max(40, Math.floor(areaK * STAR_DENSITY))
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random(), // 0..1
      r: Math.random() * MAX_RADIUS + 0.1,
      tw: Math.random() * Math.PI * 2,
      tSpeed: 0.002 + Math.random() * 0.004,
    })
  }
}

// easing for opacity gain with scroll
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function draw() {
  if (!needsRedraw) return
  needsRedraw = false

  ctx.clearRect(0, 0, width, height)

  // target opacity based on scroll within the first SCROLL_RANGE px
  const scrollAmt = Math.min(SCROLL_RANGE, Math.max(0, currentScrollY))
  const gain = smoothstep(0, SCROLL_RANGE, scrollAmt) * OPACITY_GAIN

  // parallax offset upward (negative) as you scroll down
  const parallaxOffset = -currentScrollY

  // soft radial fade at hero edges so stars blend with sky
  const radial = ctx.createRadialGradient(
    width * 0.5,
    height * 0.2,
    0,
    width * 0.5,
    height * 0.2,
    Math.max(width, height) * 0.7
  )
  radial.addColorStop(0, "rgba(255,255,255,1)")
  radial.addColorStop(1, "rgba(255,255,255,0.2)")

  for (const s of stars) {
    s.tw += s.tSpeed

    const px = s.x
    const py = s.y + parallaxOffset * (PARALLAX_STRENGTH * s.z)

    // wrap vertically so stars continue when parallax shifts
    let yy = py
    if (yy < -5) yy = height + ((yy + 5) % (height + 5))
    if (yy > height + 5) yy = ((yy - 5) % (height + 5)) - 5

    // base opacity: barely visible + small twinkle + scroll gain
    const twinkle = 0.03 * Math.sin(s.tw)
    const alpha = Math.max(
      0,
      Math.min(1, OPACITY_BASE + gain + twinkle - (1 - s.z) * 0.02)
    )

    ctx.globalAlpha = alpha
    ctx.fillStyle = radial

    // soft star
    ctx.beginPath()
    ctx.arc(px, yy, s.r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1
}

function onScroll() {
  lastKnownScrollY = window.scrollY || window.pageYOffset || 0
  requestTick()
}

let ticking = false
function requestTick() {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(update)
  }
}

function update() {
  ticking = false
  // smooth the scroll value for steadier parallax
  currentScrollY += (lastKnownScrollY - currentScrollY) * 0.1
  needsRedraw = true
  draw()
  // keep animating lightly so twinkle continues at top
  requestAnimationFrame(update)
}

window.addEventListener("resize", resize, { passive: true })
window.addEventListener("orientationchange", resize, { passive: true })
window.addEventListener("scroll", onScroll, { passive: true })

// boot
resize()
update()
