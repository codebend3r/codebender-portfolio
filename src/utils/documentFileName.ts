const ILLEGAL_CHARS = /[/\\:*?"<>|]/g

export type DocumentFormat = "pdf" | "docx"

export function documentFileName({
  name,
  label,
  extension,
}: {
  name: string
  label: string
  extension: DocumentFormat
}): string {
  const base = [name.trim(), label.trim()].filter(Boolean).join(" - ")
  return `${base.replace(ILLEGAL_CHARS, "-")}.${extension}`
}
