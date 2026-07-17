import sansItalic from "@fontsource/source-sans-3/files/source-sans-3-latin-400-italic.woff?url"
import sansRegular from "@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff?url"
import sansSemiBold from "@fontsource/source-sans-3/files/source-sans-3-latin-600-normal.woff?url"
import sansBold from "@fontsource/source-sans-3/files/source-sans-3-latin-700-normal.woff?url"
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

  Font.register({
    family: tokens.font.sans,
    fonts: [
      { src: sansRegular, fontWeight: 400, fontStyle: "normal" },
      { src: sansItalic, fontWeight: 400, fontStyle: "italic" },
      { src: sansSemiBold, fontWeight: 600, fontStyle: "normal" },
      { src: sansBold, fontWeight: 700, fontStyle: "normal" },
    ],
  })

  Font.registerHyphenationCallback((word) => [word])
}
