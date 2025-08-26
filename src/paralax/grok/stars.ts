// script.ts (Compile this TypeScript file to JavaScript if needed, e.g., via tsc)

interface Star {
  x: number
  y: number
  radius: number
  opacity: number
  speed: number // For parallax movement
}

class ParallaxSky {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private stars: Star[] = []
  private scrollOffset: number = 0
  private lastScrollY: number = 0

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement
    this.ctx = this.canvas.getContext("2d")!
    this.resizeCanvas()
    this.generateStars(200) // Number of stars
    window.addEventListener("resize", this.resizeCanvas.bind(this))
    window.addEventListener("scroll", this.handleScroll.bind(this))
    this.animate()
  }

  private resizeCanvas(): void {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.canvas.width = this.width
    this.canvas.height = this.height
  }

  private generateStars(count: number): void {
    this.stars = []
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.1, // Barely visible (low opacity)
        speed: Math.random() * 0.5 + 0.1, // Different speeds for parallax depth
      })
    }
  }

  private drawGradient(): void {
    // Sunset gradient: from orange to deep blue/purple
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, "rgba(255, 140, 0, 1)") // Orange at top
    gradient.addColorStop(0.5, "rgba(255, 69, 0, 1)") // Red-orange
    gradient.addColorStop(1, "rgba(75, 0, 130, 1)") // Indigo at bottom
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  private drawStars(): void {
    this.stars.forEach((star) => {
      this.ctx.beginPath()
      this.ctx.arc(
        star.x - this.scrollOffset * star.speed,
        star.y,
        star.radius,
        0,
        Math.PI * 2
      )
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
      this.ctx.fill()
      // Wrap around for continuous movement
      if (star.x - this.scrollOffset * star.speed > this.width) {
        star.x = -star.radius
      } else if (star.x - this.scrollOffset * star.speed < -star.radius) {
        star.x = this.width + star.radius
      }
    })
  }

  private handleScroll(): void {
    const currentScrollY = window.scrollY
    const delta = currentScrollY - this.lastScrollY
    this.scrollOffset += delta / 10 // Adjust divisor for parallax intensity
    this.lastScrollY = currentScrollY
  }

  private animate(): void {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.drawGradient()
    this.drawStars()
    requestAnimationFrame(this.animate.bind(this))
  }
}

// Initialize the parallax sky
new ParallaxSky("sky-canvas")
