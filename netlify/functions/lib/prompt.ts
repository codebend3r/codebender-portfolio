// Pure helpers for the /generate function. Keep this file free of the
// Anthropic SDK and of any I/O so it stays unit-testable.
//
// NOTE: relative imports on purpose — Netlify's esbuild bundler does not
// resolve the app's Vite aliases.
import { createHash, timingSafeEqual } from "node:crypto"

const MAX_TEXT_CHARS = 50_000
const MAX_IMAGE_BASE64_CHARS = 5_000_000 // ~3.5MB binary, under Netlify's 6MB body cap
const MAX_URL_CHARS = 2_048
// Client-minted uuid; also the Netlify Blobs key, so keep the charset tight.
export const JOB_ID_PATTERN = /^[0-9a-fA-F-]{8,64}$/

/** Constant-time password check; always false when no password is configured. */
export function validatePassword(provided: string, expected: string): boolean {
  if (!expected) return false
  const a = createHash("sha256").update(provided).digest()
  const b = createHash("sha256").update(expected).digest()
  return timingSafeEqual(a, b)
}

export function parseGenerateRequest(body: unknown): GenerateJobRequest | null {
  if (typeof body !== "object" || body === null) return null
  const { jobId, password, input } = body as Record<string, unknown>
  if (typeof jobId !== "string" || !JOB_ID_PATTERN.test(jobId)) return null
  if (typeof password !== "string") return null
  if (typeof input !== "object" || input === null) return null
  const candidate = input as Record<string, unknown>

  if (candidate.type === "text") {
    if (typeof candidate.text !== "string") return null
    if (candidate.text.length === 0 || candidate.text.length > MAX_TEXT_CHARS)
      return null
    return { jobId, password, input: { type: "text", text: candidate.text } }
  }

  if (candidate.type === "image") {
    if (typeof candidate.mediaType !== "string") return null
    if (typeof candidate.dataBase64 !== "string") return null
    if (
      candidate.dataBase64.length === 0 ||
      candidate.dataBase64.length > MAX_IMAGE_BASE64_CHARS
    )
      return null
    return {
      jobId,
      password,
      input: {
        type: "image",
        mediaType: candidate.mediaType,
        dataBase64: candidate.dataBase64,
      },
    }
  }

  if (candidate.type === "url") {
    if (typeof candidate.url !== "string") return null
    if (candidate.url.length === 0 || candidate.url.length > MAX_URL_CHARS)
      return null
    let parsed: URL
    try {
      parsed = new URL(candidate.url)
    } catch {
      return null
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
    return { jobId, password, input: { type: "url", url: candidate.url } }
  }

  return null
}

export function buildSystemPrompt(base: Data): string {
  return [
    "You tailor CJ Rivas's resume to a specific job posting.",
    "",
    "Below is CJ's REAL resume — the only source of truth about his",
    "experience, employers, dates, education, and awards:",
    "",
    JSON.stringify(base, null, 2),
    "",
    "Output a PATCH, not the whole resume — only the tailored fields:",
    "- `title` and `summary`: rewritten for relevance to the posting.",
    "- `technical_skills`: reselected/reordered from the `technical_skills`",
    "  list in the resume above, copied verbatim (descriptions are attached",
    "  automatically by name).",
    "- `work_experience`: ONLY the entries whose achievement bullets you",
    "  rephrase, as { index, achievements } where `index` is the entry's",
    "  position in the resume above. Patch at most the 4 most relevant",
    "  entries; omit the rest.",
    "- `suggestedName`: a short label for this variation such as",
    '  "Senior Frontend Engineer @ Achievers" (role @ company from the',
    "  posting).",
    "",
    "Rules:",
    "- Reorder and re-emphasize existing content to fit the target role.",
    "- Rephrase achievement bullets to foreground relevant impact.",
    "- NEVER invent employers, roles, dates, technologies, awards, or any",
    "  fact not present in the resume above.",
  ].join("\n")
}

// `url` inputs are resolved to `text` (via fetchPostingText) before the
// Claude call, so this only ever sees text or image.
export function buildUserContent(
  input: Exclude<GenerateInput, { type: "url" }>
) {
  if (input.type === "text") {
    return [
      {
        type: "text" as const,
        text: `Tailor the resume for this job posting:\n\n${input.text}`,
      },
    ]
  }
  return [
    {
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: input.mediaType,
        data: input.dataBase64,
      },
    },
    {
      type: "text" as const,
      text: "The image above is the job posting. Tailor the resume for it.",
    },
  ]
}

// ---------------------------------------------------------------------------
// JSON Schema for structured output. Mirrors `ResumePatch` in
// src/types/global.d.ts — keep the two in sync. The model returns only the
// tailored fields; `applyResumePatch` merges them over the base resume.
// ---------------------------------------------------------------------------

const str = { type: "string" } as const
const strArray = { type: "array", items: str } as const

export const PATCH_SCHEMA = {
  type: "object",
  properties: {
    title: str,
    summary: str,
    technical_skills: strArray,
    work_experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "integer" },
          achievements: strArray,
        },
        required: ["index", "achievements"],
        additionalProperties: false,
      },
    },
    suggestedName: str,
  },
  required: [
    "title",
    "summary",
    "technical_skills",
    "work_experience",
    "suggestedName",
  ],
  additionalProperties: false,
} as const
