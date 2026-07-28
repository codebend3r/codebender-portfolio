import { spawn } from "node:child_process"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { setTimeout as sleep } from "node:timers/promises"
import { fileURLToPath } from "node:url"

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const PORT = 9333
const WIDTH = 1440
const HEIGHT = 900

const ALL_TARGETS = [
  { slug: "qp-briefing", url: "https://www.qpbriefing.com" },
  { slug: "homegenius", url: "https://homegeniusrealestate.com" },
  { slug: "globe-and-mail", url: "https://www.theglobeandmail.com" },
  { slug: "toronto-star", url: "https://www.thestar.com" },
  {
    slug: "the-known-world",
    url: "https://theknownworld.netlify.app/characters/brynden-rivers/",
  },
  { slug: "kasane", url: "https://kasane-guide.netlify.app/series/101517" },
]

// Optional slug args capture only a subset, e.g. `node scripts/capture-showcase.mjs kasane`.
const only = process.argv.slice(2)
const TARGETS = only.length
  ? ALL_TARGETS.filter((t) => only.includes(t.slug))
  : ALL_TARGETS

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const outDir = join(root, "public", "showcase")
mkdirSync(outDir, { recursive: true })
const profile = mkdtempSync(join(tmpdir(), "showcase-chrome-"))

// Removes cookie banners, newsletter prompts, and centered modal overlays so the
// captured thumbnail shows the page content rather than an interstitial. Only
// high-stacking elements (z-index >= 1000) qualify, so ordinary sticky/fixed
// content wrappers are left intact.
const DISMISS_OVERLAYS = `(() => {
  const vw = innerWidth, vh = innerHeight
  const kill = (el) => el && el.parentNode && el.remove()
  const stackZ = (el) => {
    let max = 0
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const z = parseInt(getComputedStyle(n).zIndex)
      if (!Number.isNaN(z)) max = Math.max(max, z)
    }
    return max
  }
  document.querySelectorAll("body *").forEach((el) => {
    const tag = el.tagName
    if (tag === "HEADER" || tag === "NAV" || tag === "MAIN") return
    const s = getComputedStyle(el)
    if (s.position !== "fixed" && s.position !== "sticky") return
    if (stackZ(el) < 1000) return
    const r = el.getBoundingClientRect()
    if (r.width < 40 || r.height < 40) return
    const coversCenter =
      r.left < vw / 2 && r.right > vw / 2 && r.top < vh * 0.8 && r.bottom > vh * 0.2
    const fullBackdrop = r.width >= vw * 0.9 && r.height >= vh * 0.6
    if (coversCenter || fullBackdrop) kill(el)
  })
  document.querySelectorAll('[aria-modal="true"]').forEach(kill)
  document.documentElement.style.overflow = "visible"
  document.body.style.overflow = "visible"
})()`

function cdp(ws) {
  let id = 0
  const pending = new Map()
  const waiters = []
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) {
        reject(new Error(msg.error.message))
      } else {
        resolve(msg.result)
      }
    } else if (msg.method) {
      for (let i = waiters.length - 1; i >= 0; i--) {
        if (waiters[i].method === msg.method) {
          waiters[i].resolve(msg.params)
          waiters.splice(i, 1)
        }
      }
    }
  })
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const n = ++id
      pending.set(n, { resolve, reject })
      ws.send(JSON.stringify({ id: n, method, params, sessionId }))
    })
  const once = (method) =>
    new Promise((resolve) => waiters.push({ method, resolve }))
  return { send, once }
}

async function browserWsUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      const json = await res.json()
      if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl
    } catch {
      // devtools endpoint not ready yet
    }
    await sleep(200)
  }
  throw new Error("Chrome devtools endpoint never came up")
}

async function main() {
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    "about:blank",
  ])

  try {
    const ws = new WebSocket(await browserWsUrl())
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true })
      ws.addEventListener("error", reject, { once: true })
    })
    const { send, once } = cdp(ws)

    for (const { slug, url } of TARGETS) {
      console.log(`capturing ${slug} <- ${url}`)
      const { targetId } = await send("Target.createTarget", {
        url: "about:blank",
      })
      const { sessionId } = await send("Target.attachToTarget", {
        targetId,
        flatten: true,
      })
      await send("Page.enable", {}, sessionId)
      const loaded = once("Page.loadEventFired")
      await send("Page.navigate", { url }, sessionId)
      await Promise.race([loaded, sleep(20000)])
      await sleep(2500)
      await send(
        "Runtime.evaluate",
        { expression: DISMISS_OVERLAYS },
        sessionId
      )
      await sleep(600)
      const { data } = await send(
        "Page.captureScreenshot",
        { format: "png", captureBeyondViewport: false },
        sessionId
      )
      const raw = join(outDir, `${slug}.raw.png`)
      const final = join(outDir, `${slug}.png`)
      writeFileSync(raw, Buffer.from(data, "base64"))
      execFileSync("sips", ["--resampleWidth", "1200", raw, "--out", final], {
        stdio: "inherit",
      })
      rmSync(raw)
      await send("Target.closeTarget", { targetId })
    }
    ws.close()
  } finally {
    chrome.kill()
    try {
      rmSync(profile, { recursive: true, force: true })
    } catch {
      // Chrome may still be flushing its cache; the temp profile is disposable.
    }
  }
  console.log("done")
}

await main()
