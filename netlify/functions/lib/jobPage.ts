// Fetch a job-posting URL and reduce it to readable text for the prompt.
// `extractPostingText` and `isBlockedAddress` are pure; `fetchPostingText`
// is the only I/O.
import { lookup } from "node:dns/promises"

const MAX_TEXT_CHARS = 50_000
const MAX_HTML_CHARS = 2_000_000
const MIN_POSTING_CHARS = 200
const FETCH_TIMEOUT_MS = 15_000
// Cap redirect hops so a chain can't loop; each hop is re-validated below.
const MAX_REDIRECTS = 5

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

// ---------------------------------------------------------------------------
// SSRF guard. The URL is attacker-influenced (it arrives in the request body),
// so every host we connect to — including redirect targets — must resolve to a
// public address. Blocks the IMDS endpoint (169.254.169.254), loopback, and
// RFC-1918 / unique-local / link-local ranges.
// ---------------------------------------------------------------------------

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".")
  if (parts.length !== 4) return null
  const nums = parts.map((part) => Number(part))
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null
  return nums[0] * 2 ** 24 + nums[1] * 2 ** 16 + nums[2] * 2 ** 8 + nums[3]
}

const BLOCKED_V4_CIDRS: readonly [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local (cloud metadata)
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15], // benchmarking
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved
]

function isBlockedV4(ip: string): boolean {
  const value = ipv4ToInt(ip)
  if (value === null) return false
  return BLOCKED_V4_CIDRS.some(([base, bits]) => {
    const baseInt = ipv4ToInt(base)
    if (baseInt === null) return false
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
    return (value & mask) >>> 0 === (baseInt & mask) >>> 0
  })
}

function firstHextet(addr: string): number | null {
  if (addr.startsWith("::")) return 0
  const group = addr.split(":")[0]
  if (!/^[0-9a-f]{1,4}$/.test(group)) return null
  return parseInt(group, 16)
}

function isBlockedV6(ip: string): boolean {
  const addr = ip.toLowerCase().split("%")[0] // drop any zone id
  if (addr === "::1" || addr === "::") return true // loopback / unspecified
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(addr) // IPv4-mapped
  if (mapped) return isBlockedV4(mapped[1])
  const head = firstHextet(addr)
  if (head === null) return false
  if (head >= 0xfc00 && head <= 0xfdff) return true // unique-local fc00::/7
  if (head >= 0xfe80 && head <= 0xfebf) return true // link-local fe80::/10
  return false
}

/** True for any address we must never connect to (private/loopback/etc.). */
export function isBlockedAddress(ip: string): boolean {
  return ip.includes(":") ? isBlockedV6(ip) : isBlockedV4(ip)
}

// Resolves the host and refuses if ANY record is a blocked address. Checking
// every record narrows (but cannot fully close) the DNS-rebinding window
// between this lookup and fetch's own resolution.
async function assertPublicHost(hostname: string): Promise<void> {
  let records: { address: string }[]
  try {
    records = await lookup(hostname, { all: true })
  } catch {
    throw new JobPageError(`could not resolve ${hostname}`)
  }
  if (
    records.length === 0 ||
    records.some((r) => isBlockedAddress(r.address))
  ) {
    throw new JobPageError("that url resolves to a non-public address")
  }
}

function isRedirect(res: Response): boolean {
  return (
    res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)
  )
}

// Follows redirects by hand so each hop's host is validated before we connect.
// `redirect: "manual"` stops fetch from silently chasing a 3xx into a private
// address; a hop whose Location cannot be read is refused rather than followed.
async function fetchValidated(url: string, hops: number): Promise<Response> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new JobPageError(`could not reach ${url}`)
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new JobPageError("only http and https urls are supported")
  }
  await assertPublicHost(parsed.hostname)

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
  } catch {
    throw new JobPageError(`could not reach ${url}`)
  }

  if (!isRedirect(res)) return res

  if (hops <= 0) throw new JobPageError("that url redirected too many times")
  const location = res.headers.get("location")
  if (!location) {
    throw new JobPageError(
      "that page redirected in a way we can't follow — paste the posting text instead"
    )
  }
  return fetchValidated(new URL(location, url).toString(), hops - 1)
}

export async function fetchPostingText(url: string): Promise<string> {
  const res = await fetchValidated(url, MAX_REDIRECTS)

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
