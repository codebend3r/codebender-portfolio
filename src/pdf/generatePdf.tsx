import { pdf } from "@react-pdf/renderer"

import { registerPdfFonts } from "@pdf/fonts"
import { ResumePDF } from "@pdf/ResumePDF"

export async function generateResumePdf(data: Data): Promise<Blob> {
  registerPdfFonts()
  return await pdf(<ResumePDF data={data} />).toBlob()
}
