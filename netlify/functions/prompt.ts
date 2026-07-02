// Pure helpers for the /generate function. Keep this file free of the
// Anthropic SDK and of any I/O so it stays unit-testable.
//
// NOTE: relative imports on purpose — Netlify's esbuild bundler does not
// resolve the app's Vite aliases.
import { createHash, timingSafeEqual } from "node:crypto"

const MAX_TEXT_CHARS = 50_000
const MAX_IMAGE_BASE64_CHARS = 5_000_000 // ~3.5MB binary, under Netlify's 6MB body cap

/** Constant-time password check; always false when no password is configured. */
export function validatePassword(provided: string, expected: string): boolean {
  if (!expected) return false
  const a = createHash("sha256").update(provided).digest()
  const b = createHash("sha256").update(expected).digest()
  return timingSafeEqual(a, b)
}

export function parseGenerateRequest(body: unknown): GenerateRequest | null {
  if (typeof body !== "object" || body === null) return null
  const { password, input } = body as Record<string, unknown>
  if (typeof password !== "string") return null
  if (typeof input !== "object" || input === null) return null
  const candidate = input as Record<string, unknown>

  if (candidate.type === "text") {
    if (typeof candidate.text !== "string") return null
    if (candidate.text.length === 0 || candidate.text.length > MAX_TEXT_CHARS)
      return null
    return { password, input: { type: "text", text: candidate.text } }
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
      password,
      input: {
        type: "image",
        mediaType: candidate.mediaType,
        dataBase64: candidate.dataBase64,
      },
    }
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
    "Rules:",
    "- Reorder and re-emphasize existing content to fit the target role.",
    "- Rewrite the summary, title, and technical_skills selection/order for",
    "  relevance to the posting.",
    "- Rephrase achievement bullets to foreground relevant impact.",
    "- NEVER invent employers, roles, dates, technologies, awards, or any",
    "  fact not present in the resume above.",
    "- Keep the same JSON shape as the resume above.",
    "- Keep `skill_descriptions` aligned index-for-index with",
    "  `technical_skills`.",
    "- Also produce `suggestedName`: a short label for this variation such",
    '  as "Senior Frontend Engineer @ Achievers" (role @ company from the',
    "  posting).",
  ].join("\n")
}

export function buildUserContent(input: GenerateInput) {
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
// JSON Schema for structured output. Mirrors `Data` in src/types/global.d.ts
// — keep the two in sync when the resume shape changes.
// ---------------------------------------------------------------------------

const str = { type: "string" } as const
const strArray = { type: "array", items: str } as const

const DATA_SCHEMA = {
  type: "object",
  properties: {
    name: str,
    contact: {
      type: "array",
      items: {
        type: "object",
        properties: { label: str, value: str },
        required: ["label", "value"],
        additionalProperties: false,
      },
    },
    title: str,
    summary: str,
    technical_skills: strArray,
    skill_descriptions: strArray,
    work_experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: str,
          company: str,
          period: str,
          achievements: strArray,
        },
        required: ["role", "company", "period", "achievements"],
        additionalProperties: false,
      },
    },
    awards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: str,
          organization: str,
          year: { type: "integer" },
        },
        required: ["name", "organization", "year"],
        additionalProperties: false,
      },
    },
    languages: {
      type: "array",
      items: {
        type: "object",
        properties: { name: str, proficiency: str },
        required: ["name", "proficiency"],
        additionalProperties: false,
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: { program: str, institution: str, details: str },
        required: ["program", "institution"],
        additionalProperties: false,
      },
    },
    showcase: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: str,
          domain: str,
          url: str,
          role: str,
          period: str,
          description: str,
          image: str,
          tags: strArray,
        },
        required: [
          "name",
          "domain",
          "url",
          "role",
          "period",
          "description",
          "image",
          "tags",
        ],
        additionalProperties: false,
      },
    },
  },
  required: [
    "name",
    "contact",
    "title",
    "summary",
    "technical_skills",
    "skill_descriptions",
    "work_experience",
    "awards",
    "languages",
    "education",
    "showcase",
  ],
  additionalProperties: false,
} as const

export const WRAPPER_SCHEMA = {
  type: "object",
  properties: {
    resume: DATA_SCHEMA,
    suggestedName: str,
  },
  required: ["resume", "suggestedName"],
  additionalProperties: false,
} as const
