import { afterEach, describe, expect, it, vi } from "vitest"

import { JobPageError, extractPostingText, fetchPostingText } from "./jobPage"

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

function mockFetch(init: {
  status?: number
  contentType?: string
  body?: string
  reject?: boolean
}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      if (init.reject) throw new TypeError("fetch failed")
      return {
        ok: (init.status ?? 200) < 400,
        status: init.status ?? 200,
        headers: new Headers({
          "content-type": init.contentType ?? "text/html; charset=utf-8",
        }),
        text: async () => init.body ?? "",
      }
    })
  )
}

const LONG_POSTING = `<body><p>${"We are hiring a senior engineer. ".repeat(20)}</p></body>`

afterEach(() => {
  vi.unstubAllGlobals()
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
})
