import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  JobPageError,
  extractPostingText,
  fetchPostingText,
  isBlockedAddress,
} from "./jobPage"

// Hoisted so the mock factory below can reference it despite vi.mock hoisting.
// Typed to the `{ all: true }` overload so mockResolvedValue accepts an array.
const { mockLookup } = vi.hoisted(() => ({
  mockLookup:
    vi.fn<
      (hostname: string, options: unknown) => Promise<{ address: string }[]>
    >(),
}))

vi.mock("node:dns/promises", () => ({
  lookup: mockLookup,
  default: { lookup: mockLookup },
}))

describe("extractPostingText", () => {
  it("strips tags and keeps visible text", () => {
    const html = `<html><body><h1>Senior Frontend Engineer</h1>
      <p>Build <strong>great</strong> UIs.</p></body></html>`
    const text = extractPostingText(html)
    expect(text).toContain("Senior Frontend Engineer")
    expect(text).toContain("Build great UIs.")
    expect(text).not.toContain("<")
  })

  it("drops script, style, noscript, head, and comments", () => {
    const html = `<html><head><title>ignore me</title>
      <style>.a { color: red }</style></head><body>
      <script>window.SECRET = "tracking"</script>
      <noscript>enable js</noscript>
      <!-- hidden comment -->
      <p>The posting</p></body></html>`
    const text = extractPostingText(html)
    expect(text).toBe("The posting")
  })

  it("turns block-level boundaries into line breaks", () => {
    const html = `<div>Requirements</div><ul><li>React</li><li>TypeScript</li></ul>`
    const text = extractPostingText(html)
    expect(text.split("\n").map((l) => l.trim())).toEqual([
      "Requirements",
      "React",
      "TypeScript",
    ])
  })

  it("decodes common html entities", () => {
    const text = extractPostingText(
      `<p>Design &amp; build &lt;fast&gt; UIs&nbsp;&#8212; that&#x27;s it</p>`
    )
    expect(text).toBe("Design & build <fast> UIs — that's it")
  })

  it("collapses runs of whitespace", () => {
    const text = extractPostingText(`<p>a    b</p>\n\n\n<p></p><p></p><p>c</p>`)
    expect(text).toBe("a b\nc")
  })

  it("caps output at 50k chars", () => {
    const text = extractPostingText(`<p>${"y".repeat(60_000)}</p>`)
    expect(text.length).toBe(50_000)
  })
})

describe("isBlockedAddress", () => {
  it("blocks the cloud metadata endpoint", () => {
    expect(isBlockedAddress("169.254.169.254")).toBe(true)
  })

  it("blocks loopback and RFC-1918 ranges", () => {
    expect(isBlockedAddress("127.0.0.1")).toBe(true)
    expect(isBlockedAddress("10.1.2.3")).toBe(true)
    expect(isBlockedAddress("172.16.5.5")).toBe(true)
    expect(isBlockedAddress("192.168.1.1")).toBe(true)
    expect(isBlockedAddress("100.64.0.1")).toBe(true)
  })

  it("blocks IPv6 loopback, unique-local, link-local, and mapped v4", () => {
    expect(isBlockedAddress("::1")).toBe(true)
    expect(isBlockedAddress("fd00::1")).toBe(true)
    expect(isBlockedAddress("fe80::1")).toBe(true)
    expect(isBlockedAddress("::ffff:169.254.169.254")).toBe(true)
  })

  it("allows ordinary public addresses", () => {
    expect(isBlockedAddress("93.184.216.34")).toBe(false)
    expect(isBlockedAddress("8.8.8.8")).toBe(false)
    expect(isBlockedAddress("2606:4700:4700::1111")).toBe(false)
  })
})

type FetchResult = {
  status?: number
  contentType?: string
  location?: string
  body?: string
  reject?: boolean
}

// Queue one result per fetch call so redirect chains can be simulated.
function mockFetchSequence(results: FetchResult[]) {
  const queue = [...results]
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      const init = queue.shift() ?? {}
      if (init.reject) throw new TypeError("fetch failed")
      const status = init.status ?? 200
      const headers = new Headers({
        "content-type": init.contentType ?? "text/html; charset=utf-8",
      })
      if (init.location) headers.set("location", init.location)
      return {
        ok: status >= 200 && status < 400,
        status,
        type: "default",
        headers,
        text: async () => init.body ?? "",
      }
    })
  )
}

function mockFetch(init: FetchResult) {
  mockFetchSequence([init])
}

const LONG_POSTING = `<body><p>${"We are hiring a senior engineer. ".repeat(20)}</p></body>`

beforeEach(() => {
  // Default: every host resolves to a public address.
  mockLookup.mockResolvedValue([{ address: "93.184.216.34" }])
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe("fetchPostingText", () => {
  it("returns extracted text from an html page", async () => {
    mockFetch({ body: LONG_POSTING })
    const text = await fetchPostingText("https://jobs.example/role")
    expect(text).toContain("We are hiring a senior engineer.")
    expect(text).not.toContain("<p>")
  })

  it("throws a JobPageError when the request fails", async () => {
    mockFetch({ reject: true })
    await expect(fetchPostingText("https://jobs.example/x")).rejects.toThrow(
      JobPageError
    )
  })

  it("throws a JobPageError on a non-ok status", async () => {
    mockFetch({ status: 404, body: LONG_POSTING })
    await expect(fetchPostingText("https://jobs.example/gone")).rejects.toThrow(
      /404/
    )
  })

  it("throws a JobPageError on a non-html content type", async () => {
    mockFetch({ contentType: "application/pdf", body: LONG_POSTING })
    await expect(fetchPostingText("https://jobs.example/x")).rejects.toThrow(
      JobPageError
    )
  })

  it("throws a JobPageError when the page has almost no text", async () => {
    mockFetch({
      body: `<body><div id="root"></div><script>spa()</script></body>`,
    })
    await expect(fetchPostingText("https://jobs.example/spa")).rejects.toThrow(
      /paste the posting text/i
    )
  })

  it("refuses a url that resolves to a private address", async () => {
    mockLookup.mockResolvedValue([{ address: "169.254.169.254" }])
    mockFetch({ body: LONG_POSTING })
    await expect(
      fetchPostingText("https://metadata.evil.example/")
    ).rejects.toThrow(/non-public address/)
  })

  it("re-validates the host on each redirect hop", async () => {
    // Public host 301-redirects to a host that resolves to the metadata IP.
    mockLookup
      .mockResolvedValueOnce([{ address: "93.184.216.34" }])
      .mockResolvedValueOnce([{ address: "169.254.169.254" }])
    mockFetchSequence([
      { status: 301, location: "https://internal.evil.example/" },
      { body: LONG_POSTING },
    ])
    await expect(
      fetchPostingText("https://jobs.example/redirect")
    ).rejects.toThrow(/non-public address/)
  })

  it("follows a redirect to another public host", async () => {
    mockFetchSequence([
      { status: 302, location: "https://jobs.example/final" },
      { body: LONG_POSTING },
    ])
    const text = await fetchPostingText("https://jobs.example/start")
    expect(text).toContain("We are hiring a senior engineer.")
  })

  it("refuses a non-http protocol", async () => {
    await expect(fetchPostingText("file:///etc/passwd")).rejects.toThrow(
      JobPageError
    )
  })
})
