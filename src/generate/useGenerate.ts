import { useCallback, useState } from "react"

export type GenerateStatus = "idle" | "generating" | "done" | "error"

const ENDPOINT = "/.netlify/functions/generate"

export function useGenerate() {
  const [status, setStatus] = useState<GenerateStatus>("idle")
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (req: GenerateRequest) => {
    setStatus("generating")
    setResult(null)
    setError(null)
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(req),
      })
      if (res.status === 401) {
        setStatus("error")
        setError("Wrong password")
        return
      }
      if (!res.ok) {
        setStatus("error")
        setError("Generation failed — try again")
        return
      }
      const body = (await res.json()) as GenerateResponse
      setResult(body)
      setStatus("done")
    } catch {
      setStatus("error")
      setError("Network error — is the function running?")
    }
  }, [])

  const reset = useCallback(() => {
    setStatus("idle")
    setResult(null)
    setError(null)
  }, [])

  return { status, result, error, generate, reset }
}
