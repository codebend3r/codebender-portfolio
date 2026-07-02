import { pdf } from "@react-pdf/renderer"

import { ResumePDF } from "@pdf/ResumePDF"
import { registerPdfFonts } from "@pdf/fonts"

export async function generateResumePdf(data: Data): Promise<Blob> {
  registerPdfFonts()
  return await pdf(<ResumePDF data={data} />).toBlob()
}
