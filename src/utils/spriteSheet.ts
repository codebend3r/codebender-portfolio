// The sun, moon, and cloud sprite sheets are square grids of equally sized
// cells; `spritePosition` converts a cell index into the background-position
// percentages that display that cell.
export const SPRITE_GRID = 3
export const SPRITE_COUNT = SPRITE_GRID * SPRITE_GRID

export function spritePosition(shape: number): { x: string; y: string } {
  const index = ((shape % SPRITE_COUNT) + SPRITE_COUNT) % SPRITE_COUNT
  const col = index % SPRITE_GRID
  const row = Math.floor(index / SPRITE_GRID)
  const step = 100 / (SPRITE_GRID - 1)
  return { x: `${col * step}%`, y: `${row * step}%` }
}
