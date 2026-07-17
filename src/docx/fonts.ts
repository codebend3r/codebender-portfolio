import sansRegular from "@docx/fonts/SourceSans3-Regular.ttf?url"
import serifRegular from "@docx/fonts/SourceSerif4-Regular.ttf?url"
import serifSemibold from "@docx/fonts/SourceSerif4-Semibold.ttf?url"
import { tokens } from "@theme/tokens"
import { Buffer } from "buffer"

export type DocxFont = { name: string; data: Buffer }

async function loadFont({
  name,
  url,
}: {
  name: string
  url: string
}): Promise<DocxFont> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load font "${name}" (${response.status})`)
  }
  return { name, data: Buffer.from(await response.arrayBuffer()) }
}

// Word embeds one face per font-table family name. Regular carries the
// style-linked bold/italic runs; Semibold is its own legacy family (used by
// company lines). Names must match the TTFs' internal family names.
export function loadDocxFonts(): Promise<DocxFont[]> {
  return Promise.all([
    loadFont({ name: tokens.font.family, url: serifRegular }),
    loadFont({ name: `${tokens.font.family} Semibold`, url: serifSemibold }),
    loadFont({ name: tokens.font.sans, url: sansRegular }),
  ])
}
