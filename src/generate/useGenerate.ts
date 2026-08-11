import { useCallback, useState } from "react"

export type GenerateStatus = "idle" | "generating" | "done" | "error"

// /generate is a Netlify *background* function: it replies 202 immediately
// and reports progress through a blob read back via /generate-status.
const GENERATE_ENDPOINT = "/.netlify/functions/generate"
const STATUS_ENDPOINT = "/.netlify/functions/generate-status"
const POLL_INTERVAL_MS = 2_500
// Client patience only — it does not extend the server's budget. The function
// is killed at ~30s on the Free plan, so a job still `pending` well before this
// deadline is already dead and the remaining polls are waiting on nothing.
// Kept generous so a slow-but-alive run is never cut off by the client.
const POLL_TIMEOUT_MS = 240_000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function useGenerate() {
  const [status, setStatus] = useState<GenerateStatus>("idle")
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (req: GenerateRequest) => {
    setStatus("generating")
    setResult(null)
    setError(null)
    const fail = (message: string) => {
      setStatus("error")
      setError(message)
    }

    try {
      const jobId = crypto.randomUUID()
      const kickoff = await fetch(GENERATE_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...req, jobId } satisfies GenerateJobRequest),
      })
      if (!kickoff.ok) {
        fail("could not start the generation — try again")
        return
      }

      const deadline = Date.now() + POLL_TIMEOUT_MS
      while (Date.now() < deadline) {
        const poll = await fetch(`${STATUS_ENDPOINT}?id=${jobId}`)
        if (poll.ok) {
          const job = (await poll.json()) as GenerateJob
          if (job.status === "done") {
            setResult({ data: job.data, suggestedName: job.suggestedName })
            setStatus("done")
            return
          }
          if (job.status === "error") {
            fail(job.error)
            return
          }
        }
        await sleep(POLL_INTERVAL_MS)
      }
      fail("timed out waiting for the generation — try again")
    } catch {
      fail("network error — is the function running?")
    }
  }, [])

  const reset = useCallback(() => {
    setStatus("idle")
    setResult(null)
    setError(null)
  }, [])

  return { status, result, error, generate, reset }
}
