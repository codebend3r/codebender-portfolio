const ILLEGAL_CHARS = /[/\\:*?"<>|]/g

export function pdfFileName(name: string, label: string): string {
  const base = [name.trim(), label.trim()].filter(Boolean).join(" - ")
  return `${base.replace(ILLEGAL_CHARS, "-")}.pdf`
}
