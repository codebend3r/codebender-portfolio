import { buildResumeDocument } from "@docx/ResumeDocx"
import { loadDocxFonts } from "@docx/fonts"
import { Packer } from "docx"

export async function generateResumeDocx(data: Data): Promise<Blob> {
  const fonts = await loadDocxFonts()
  return await Packer.toBlob(buildResumeDocument({ data, fonts }))
}
