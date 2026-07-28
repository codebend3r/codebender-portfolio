// Vector path data mirrors the inline GitHub/LinkedIn SVG icons in
// Header.tsx, redrawn here for the PDF/Word exporters, which render icons
// through different primitives than the DOM (react-pdf's Svg/Path vs.
// docx's raw SVG embedding).
export const ICON_VIEWBOX = "0 0 24 24"

export const GITHUB_ICON_PATH =
  "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"

export const LINKEDIN_ICON_PATH =
  "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
export const LINKEDIN_ICON_RECT = { x: 2, y: 9, width: 4, height: 12 } as const
export const LINKEDIN_ICON_CIRCLE = { cx: 4, cy: 4, r: 2 } as const

export const EMAIL_ICON_RECT = {
  x: 2,
  y: 4,
  width: 20,
  height: 16,
  rx: 2,
} as const
export const EMAIL_ICON_PATH = "m2 7 10 6 10-6"

export const PHONE_ICON_PATH =
  "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"

const strokeAttrs = (color: string) =>
  `fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`

// docx (Word) can't reuse react-pdf's Svg/Path primitives, so it gets the
// same shapes as a literal SVG document string instead.
export function githubIconSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ICON_VIEWBOX}"><path ${strokeAttrs(color)} d="${GITHUB_ICON_PATH}" /></svg>`
}

export function linkedinIconSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ICON_VIEWBOX}"><path ${strokeAttrs(color)} d="${LINKEDIN_ICON_PATH}" /><rect ${strokeAttrs(color)} x="${LINKEDIN_ICON_RECT.x}" y="${LINKEDIN_ICON_RECT.y}" width="${LINKEDIN_ICON_RECT.width}" height="${LINKEDIN_ICON_RECT.height}" /><circle ${strokeAttrs(color)} cx="${LINKEDIN_ICON_CIRCLE.cx}" cy="${LINKEDIN_ICON_CIRCLE.cy}" r="${LINKEDIN_ICON_CIRCLE.r}" /></svg>`
}

export function emailIconSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ICON_VIEWBOX}"><rect ${strokeAttrs(color)} x="${EMAIL_ICON_RECT.x}" y="${EMAIL_ICON_RECT.y}" width="${EMAIL_ICON_RECT.width}" height="${EMAIL_ICON_RECT.height}" rx="${EMAIL_ICON_RECT.rx}" /><path ${strokeAttrs(color)} d="${EMAIL_ICON_PATH}" /></svg>`
}

export function phoneIconSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ICON_VIEWBOX}"><path ${strokeAttrs(color)} d="${PHONE_ICON_PATH}" /></svg>`
}

// A minimal 1x1 transparent PNG. docx requires a raster fallback for SVG
// images (for pre-2016 Word); every modern viewer renders the SVG itself.
export const TRANSPARENT_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
