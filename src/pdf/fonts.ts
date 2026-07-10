import serifItalic from "@fontsource/source-serif-4/files/source-serif-4-latin-400-italic.woff?url"
import serifRegular from "@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff?url"
import serifSemiBoldItalic from "@fontsource/source-serif-4/files/source-serif-4-latin-600-italic.woff?url"
import serifSemiBold from "@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff?url"
import serifBold from "@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff?url"
import { Font } from "@react-pdf/renderer"
import { tokens } from "@theme/tokens"

let registered = false

export function registerPdfFonts() {
  if (registered) return
  registered = true

  Font.register({
    family: tokens.font.family,
    fonts: [
      { src: serifRegular, fontWeight: 400, fontStyle: "normal" },
      { src: serifItalic, fontWeight: 400, fontStyle: "italic" },
      { src: serifSemiBold, fontWeight: 600, fontStyle: "normal" },
      { src: serifSemiBoldItalic, fontWeight: 600, fontStyle: "italic" },
      { src: serifBold, fontWeight: 700, fontStyle: "normal" },
    ],
  })

  Font.registerHyphenationCallback((word) => [word])
}
