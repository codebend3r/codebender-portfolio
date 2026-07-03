import type React from "react"

import styles from "./DropArea.module.css"

export const MAX_IMAGE_BYTES = 3_500_000

type DropAreaProps = {
  value: GenerateInput | null
  onChange: (input: GenerateInput | null) => void
  onError: (message: string) => void
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      resolve(url.slice(url.indexOf(",") + 1)) // strip data:*;base64, prefix
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function DropArea({ value, onChange, onError }: DropAreaProps) {
  const acceptImage = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return false
    if (file.size > MAX_IMAGE_BYTES) {
      onError("Image is too large — max ~3.5MB")
      return true
    }
    try {
      const dataBase64 = await fileToBase64(file)
      onChange({ type: "image", mediaType: file.type, dataBase64 })
    } catch {
      onError("Could not read the image file")
    }
    return true
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    await acceptImage(e.dataTransfer?.files?.[0])
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
      i.type.startsWith("image/")
    )
    if (!item) return // let text paste fall through to the textarea
    e.preventDefault()
    await acceptImage(item.getAsFile() ?? undefined)
  }

  const handleText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    onChange(text ? { type: "text", text } : null)
  }

  return (
    <div
      aria-label="Drop area"
      className={styles.dropArea}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {value?.type === "image" ? (
        <div className={styles.imageBadge}>
          <span>Image attached ({value.mediaType})</span>
          <button type="button" onClick={() => onChange(null)}>
            Clear
          </button>
        </div>
      ) : (
        <textarea
          aria-label="Job posting"
          className={styles.textarea}
          placeholder="Paste the job posting text or URL — or paste/drop a screenshot"
          rows={12}
          value={value?.type === "text" ? value.text : ""}
          onChange={handleText}
        />
      )}
    </div>
  )
}
