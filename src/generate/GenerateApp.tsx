import { useState } from "react"

import { DropArea } from "@generate/DropArea"
import styles from "@generate/GenerateApp.module.css"
import { GeneratePreview } from "@generate/GeneratePreview"
import { useGenerate } from "@generate/useGenerate"

import { useVariations } from "@state/useVariations"

import { hashInput } from "@utils/hashInput"
import { navigate } from "@utils/navigate"
import { normalizeInput } from "@utils/normalizeInput"

const PASSWORD_KEY = "generate-password"

const COPY: Record<GenerateMode, { title: string; hint: string }> = {
  proximate: {
    title: "Generate a tailored resume",
    hint: "Paste a job posting (text, link, or screenshot). Claude tailors the base resume into a new variation — the original is never modified.",
  },
  exact: {
    title: "Generate an exact-match resume",
    hint: "Paste a job posting (text, link, or screenshot). Claude rewrites the base resume to cover every requirement — details may be embellished at the real employers, so review each highlighted line.",
  },
}

function sourcePreviewOf(input: GenerateInput): string {
  if (input.type === "text") return input.text.trim().slice(0, 200)
  if (input.type === "url") return input.url.slice(0, 200)
  return `image (${input.mediaType})`
}

export default function GenerateApp({ mode }: { mode: GenerateMode }) {
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

    // A lone pasted URL becomes a url input — the function fetches the page.
    const normalized = normalizeInput(input)
    const h = await hashInput({ input: normalized, mode })
    setSubmitted({ input: normalized, hash: h })

    const existing = findByHash(h)
    if (existing) {
      setExistingId(existing.id)
      return
    }
    await generate({ password, input: normalized, mode })
  }

  const handleRegenerate = async () => {
    if (!submitted) return
    setExistingId(null)
    await generate({ password, input: submitted.input, mode })
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
      <h1>{COPY[mode].title}</h1>
      <p className={styles.hint}>{COPY[mode].hint}</p>

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
          className={styles.passwordInput}
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

      {status === "generating" && (
        <div className={styles.progress} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          <span>
            Generating your tailored resume — this can take a minute or two.
          </span>
        </div>
      )}

      {(inputError || error) && (
        <p className={styles.error} role="alert">
          {inputError ?? error}
        </p>
      )}

      <button
        type="button"
        className={styles.generateButton}
        disabled={!input || !password || status === "generating"}
        onClick={handleGenerate}
      >
        {status === "generating" ? "Generating…" : "Generate"}
      </button>
    </main>
  )
}
