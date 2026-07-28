import { Buffer } from "buffer"

import logoUrl from "@assets/robot-logo.png?url"

// Mirrors fonts.ts's loadFont: Vite serves the asset behind a `?url` import,
// so it has to be fetched to get the raw bytes docx's ImageRun needs.
export async function loadDocxLogo(): Promise<Buffer> {
  const response = await fetch(logoUrl)
  if (!response.ok) {
    throw new Error(`Failed to load logo (${response.status})`)
  }
  return Buffer.from(await response.arrayBuffer())
}
