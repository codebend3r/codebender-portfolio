import interItalic from "@fontsource/inter/files/inter-latin-400-italic.woff?url"
import interRegular from "@fontsource/inter/files/inter-latin-400-normal.woff?url"
import interMedium from "@fontsource/inter/files/inter-latin-500-normal.woff?url"
import interSemiBold from "@fontsource/inter/files/inter-latin-600-normal.woff?url"
import interBold from "@fontsource/inter/files/inter-latin-700-normal.woff?url"
import { Font } from "@react-pdf/renderer"

import { tokens } from "@pdf/tokens"

let registered = false

export function registerPdfFonts() {
  if (registered) return
  registered = true

  Font.register({
    family: tokens.font.family,
    fonts: [
      { src: interRegular, fontWeight: 400, fontStyle: "normal" },
      { src: interItalic, fontWeight: 400, fontStyle: "italic" },
      { src: interMedium, fontWeight: 500, fontStyle: "normal" },
      { src: interSemiBold, fontWeight: 600, fontStyle: "normal" },
      { src: interBold, fontWeight: 700, fontStyle: "normal" },
    ],
  })

  Font.registerHyphenationCallback((word) => [word])
}
