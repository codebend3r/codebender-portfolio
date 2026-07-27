import { buildResumeDocument } from "@docx/ResumeDocx"
import { loadDocxLogo } from "@docx/assets"
import { loadDocxFonts } from "@docx/fonts"
import { Packer } from "docx"

export async function generateResumeDocx(data: Data): Promise<Blob> {
  const [fonts, logo] = await Promise.all([loadDocxFonts(), loadDocxLogo()])
  return await Packer.toBlob(buildResumeDocument({ data, fonts, logo }))
}
