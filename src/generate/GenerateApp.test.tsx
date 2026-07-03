import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import resume from "@data/resume.json"

import GenerateApp from "@generate/GenerateApp"

import { useStore } from "@state/useStore"
import { useVariations } from "@state/useVariations"

import { navigate } from "@utils/navigate"

vi.mock("@utils/navigate", () => ({ navigate: vi.fn() }))

const okBody: GenerateResponse = {
  data: {
    ...(structuredClone(resume) as Data),
    name: "Generated Name",
  },
  suggestedName: "Frontend @ Acme",
}

const doneJob: GenerateJob = { status: "done", ...okBody }

type FetchCall = { url: string; init?: RequestInit }

/**
 * Stub fetch for the background-job flow: 202 on the kickoff POST, `job`
 * (value or promise) on every /generate-status poll. Returns the call log.
 */
function mockJobFetch(job: GenerateJob | Promise<GenerateJob>) {
  const calls: FetchCall[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url: String(url), init })
      if (String(url).includes("generate-status")) {
        return { ok: true, status: 200, json: () => Promise.resolve(job) }
      }
      return { ok: true, status: 202, json: async () => ({}) }
    })
  )
  return calls
}

function postedBody(calls: FetchCall[]): GenerateJobRequest {
  const post = calls.find((c) => !c.url.includes("generate-status"))
  return JSON.parse(String(post?.init?.body)) as GenerateJobRequest
}

beforeAll(async () => {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.randomUUID) {
    const { webcrypto } = await import("node:crypto")
    Object.defineProperty(globalThis, "crypto", { value: webcrypto })
  }
})

beforeEach(() => {
  localStorage.clear()
  useVariations.setState({ variations: [], activeId: null })
  useStore.getState().loadData(structuredClone(resume) as Data)
  mockJobFetch(doneJob)
})

async function fillAndGenerate(text = "Senior Frontend Engineer at Acme") {
  fireEvent.change(screen.getByRole("textbox", { name: /job posting/i }), {
    target: { value: text },
  })
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "hunter2" },
  })
  fireEvent.click(screen.getByRole("button", { name: /^generate$/i }))
}

describe("GenerateApp", () => {
  it("generates and shows the preview with the suggested name", async () => {
    render(<GenerateApp />)
    await fillAndGenerate()
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: /variation name/i })
      ).toHaveValue("Frontend @ Acme")
    )
  })

  it("saves a variation with hash meta and navigates to the editor", async () => {
    render(<GenerateApp />)
    await fillAndGenerate()
    await waitFor(() =>
      screen.getByRole("textbox", { name: /variation name/i })
    )
    fireEvent.click(screen.getByRole("button", { name: /save & edit/i }))
    const state = useVariations.getState()
    expect(state.variations).toHaveLength(1)
    expect(state.variations[0].origin).toBe("generated")
    expect(state.variations[0].hash).toMatch(/^[0-9a-f]{12}$/)
    expect(state.variations[0].sourcePreview).toContain("Senior Frontend")
    expect(state.activeId).toBe(state.variations[0].id)
    expect(navigate).toHaveBeenCalledWith("/edit-resume")
  })

  it("sends a lone pasted url as a url input", async () => {
    const calls = mockJobFetch(doneJob)
    render(<GenerateApp />)
    await fillAndGenerate("  https://jobs.lever.co/acme/123?src=indeed \n")
    await waitFor(() =>
      screen.getByRole("textbox", { name: /variation name/i })
    )
    expect(postedBody(calls).input).toEqual({
      type: "url",
      url: "https://jobs.lever.co/acme/123?src=indeed",
    })
  })

  it("saves the url as the variation sourcePreview", async () => {
    mockJobFetch(doneJob)
    render(<GenerateApp />)
    await fillAndGenerate("https://jobs.lever.co/acme/123")
    await waitFor(() =>
      screen.getByRole("textbox", { name: /variation name/i })
    )
    fireEvent.click(screen.getByRole("button", { name: /save & edit/i }))
    expect(useVariations.getState().variations[0].sourcePreview).toBe(
      "https://jobs.lever.co/acme/123"
    )
  })

  it("offers to open an existing variation when the hash matches", async () => {
    render(<GenerateApp />)
    // Seed a variation whose hash equals the hash of the input we'll paste
    const { hashInput } = await import("@utils/hashInput")
    const hash = await hashInput({
      type: "text",
      text: "Senior Frontend Engineer at Acme",
    })
    useVariations
      .getState()
      .createVariation("Existing", structuredClone(resume) as Data, {
        hash,
        origin: "generated",
      })
    useVariations.getState().selectVariation(null)

    await fillAndGenerate()
    await waitFor(() =>
      expect(screen.getByText(/already generated/i)).toBeInTheDocument()
    )
    expect(fetch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: /open existing/i }))
    expect(navigate).toHaveBeenCalledWith("/edit-resume")
  })

  it("shows a progress indicator while generating", async () => {
    let resolveJob!: (job: GenerateJob) => void
    mockJobFetch(new Promise<GenerateJob>((res) => (resolveJob = res)))
    render(<GenerateApp />)
    await fillAndGenerate()

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/generating/i)
    )

    resolveJob(doneJob)
    await waitFor(() =>
      screen.getByRole("textbox", { name: /variation name/i })
    )
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("shows the job error message on failure", async () => {
    mockJobFetch({ status: "error", error: "wrong password" })
    render(<GenerateApp />)
    await fillAndGenerate()
    await waitFor(() =>
      expect(screen.getByText(/wrong password/i)).toBeInTheDocument()
    )
  })

  it("freezes hash and sourcePreview at generate time", async () => {
    let resolveJob!: (job: GenerateJob) => void
    mockJobFetch(new Promise<GenerateJob>((res) => (resolveJob = res)))
    render(<GenerateApp />)
    await fillAndGenerate("Original posting")
    await waitFor(() => expect(fetch).toHaveBeenCalled())

    fireEvent.change(screen.getByRole("textbox", { name: /job posting/i }), {
      target: { value: "Edited during flight" },
    })
    resolveJob(doneJob)
    await waitFor(() =>
      screen.getByRole("textbox", { name: /variation name/i })
    )
    fireEvent.click(screen.getByRole("button", { name: /save & edit/i }))

    const { hashInput } = await import("@utils/hashInput")
    const v = useVariations.getState().variations[0]
    expect(v.sourcePreview).toContain("Original posting")
    expect(v.hash).toBe(
      await hashInput({ type: "text", text: "Original posting" })
    )
  })

  it("clears the dedupe notice when the input changes", async () => {
    const { hashInput } = await import("@utils/hashInput")
    const hash = await hashInput({
      type: "text",
      text: "Senior Frontend Engineer at Acme",
    })
    useVariations
      .getState()
      .createVariation("Existing", structuredClone(resume) as Data, { hash })
    useVariations.getState().selectVariation(null)

    render(<GenerateApp />)
    await fillAndGenerate()
    await waitFor(() =>
      expect(screen.getByText(/already generated/i)).toBeInTheDocument()
    )

    fireEvent.change(screen.getByRole("textbox", { name: /job posting/i }), {
      target: { value: "A different posting" },
    })
    expect(screen.queryByText(/already generated/i)).not.toBeInTheDocument()
  })
})
