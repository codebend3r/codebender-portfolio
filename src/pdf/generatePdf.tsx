import { pdf } from "@react-pdf/renderer"

import { ResumePDF } from "@pdf/ResumePDF"
import { registerPdfFonts } from "@pdf/fonts"

export async function generateResumePdf(data: Data): Promise<Blob> {
  registerPdfFonts()
  return await pdf(<ResumePDF data={data} />).toBlob()
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
