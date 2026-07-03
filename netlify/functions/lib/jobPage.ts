// Fetch a job-posting URL and reduce it to readable text for the prompt.
// `extractPostingText` is pure; `fetchPostingText` is the only I/O.

const MAX_TEXT_CHARS = 50_000
const MAX_HTML_CHARS = 2_000_000
const MIN_POSTING_CHARS = 200
const FETCH_TIMEOUT_MS = 15_000

// Some job boards refuse requests without a browser-looking user agent.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

/** Error whose message is safe to show verbatim in the UI. */
export class JobPageError extends Error {}

const BLOCK_TAGS =
  "p|div|li|ul|ol|br|hr|tr|td|th|table|h[1-6]|section|article|header|footer|main|aside|blockquote|pre|form|fieldset"

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(parseInt(dec, 10))
    )
    .replace(
      /&([a-zA-Z]+);/g,
      (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match
    )
}

export function extractPostingText(html: string): string {
  const text = html
    .slice(0, MAX_HTML_CHARS)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(
      /<(script|style|noscript|head|svg|iframe)\b[\s\S]*?<\/\1\s*>/gi,
      " "
    )
    .replace(new RegExp(`</?(?:${BLOCK_TAGS})\\b[^>]*>`, "gi"), "\n")
    .replace(/<[^>]+>/g, " ")

  return decodeEntities(text)
    .replace(/[^\S\n]+/g, " ") // collapse spaces/tabs, keep newlines
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, MAX_TEXT_CHARS)
}

export async function fetchPostingText(url: string): Promise<string> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
  } catch {
    throw new JobPageError(`could not reach ${url}`)
  }

  if (!res.ok) {
    throw new JobPageError(`the job page returned HTTP ${res.status}`)
  }

  const contentType = res.headers.get("content-type") ?? ""
  if (!/text\/html|application\/xhtml|text\/plain/i.test(contentType)) {
    throw new JobPageError(
      `the url returned "${contentType || "an unknown type"}" instead of a web page`
    )
  }

  const text = extractPostingText(await res.text())
  if (text.length < MIN_POSTING_CHARS) {
    throw new JobPageError(
      "the page has almost no readable text (it may need JavaScript) — paste the posting text instead"
    )
  }
  return text
}
