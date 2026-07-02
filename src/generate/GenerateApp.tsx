import { useState } from "react"

import { DropArea } from "@generate/DropArea"
import styles from "@generate/GenerateApp.module.css"
import { GeneratePreview } from "@generate/GeneratePreview"
import { useGenerate } from "@generate/useGenerate"

import { useVariations } from "@state/useVariations"

import { hashInput } from "@utils/hashInput"
import { navigate } from "@utils/navigate"

const PASSWORD_KEY = "generate-password"

function sourcePreviewOf(input: GenerateInput): string {
  return input.type === "text"
    ? input.text.trim().slice(0, 200)
    : `image (${input.mediaType})`
}

export default function GenerateApp() {
  const [input, setInput] = useState<GenerateInput | null>(null)
  const [password, setPassword] = useState(
    () => localStorage.getItem(PASSWORD_KEY) ?? ""
  )
  const [inputError, setInputError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<{
    input: GenerateInput
    hash: string
  } | null>(null)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [name, setName] = useState("")

  const { status, result, error, generate, reset } = useGenerate()
  const { createVariation, findByHash, selectVariation } = useVariations()

  const handleGenerate = async () => {
    if (!input) return
    setInputError(null)
    setExistingId(null)
    localStorage.setItem(PASSWORD_KEY, password)

    const h = await hashInput(input)
    setSubmitted({ input, hash: h })

    const existing = findByHash(h)
    if (existing) {
      setExistingId(existing.id)
      return
    }
    await generate({ password, input })
  }

  const handleRegenerate = async () => {
    if (!submitted) return
    setExistingId(null)
    await generate({ password, input: submitted.input })
  }

  const handleOpenExisting = () => {
    if (!existingId) return
    selectVariation(existingId)
    navigate("/edit-resume")
  }

  const handleConfirm = () => {
    if (!result || !submitted) return
    createVariation(name || result.suggestedName, result.data, {
      hash: submitted.hash,
      sourcePreview: sourcePreviewOf(submitted.input),
      origin: "generated",
    })
    navigate("/edit-resume")
  }

  const handleDiscard = () => {
    reset()
    setExistingId(null)
    setName("")
  }

  if (status === "done" && result) {
    return (
      <main className={styles.page}>
        <h1>Review generated resume</h1>
        <GeneratePreview
          data={result.data}
          name={name || result.suggestedName}
          onNameChange={setName}
          onConfirm={handleConfirm}
          onDiscard={handleDiscard}
        />
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <h1>Generate a tailored resume</h1>
      <p className={styles.hint}>
        Paste a job posting (text or screenshot). Claude tailors the base resume
        into a new variation — the original is never modified.
      </p>

      <DropArea
        value={input}
        onChange={(next) => {
          setInput(next)
          setExistingId(null)
        }}
        onError={setInputError}
      />

      <label className={styles.passwordLabel}>
        Password
        <input
          aria-label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {existingId && (
        <div className={styles.notice} role="status">
          <span>Already generated from this exact input.</span>
          <button type="button" onClick={handleOpenExisting}>
            Open existing
          </button>
          <button type="button" onClick={handleRegenerate}>
            Regenerate
          </button>
        </div>
      )}

      {(inputError || error) && (
        <p className={styles.error} role="alert">
          {inputError ?? error}
        </p>
      )}

      <button
        type="button"
        disabled={!input || !password || status === "generating"}
        onClick={handleGenerate}
      >
        {status === "generating" ? "Generating…" : "Generate"}
      </button>
    </main>
  )
}
