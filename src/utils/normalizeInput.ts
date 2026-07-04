/**
 * Promote a text input whose entire content is a single http(s) URL to a
 * `url` input, so the server fetches the job posting instead of handing
 * Claude a bare link. Anything else passes through untouched.
 */
const LONE_URL = /^https?:\/\/\S+$/i

export function normalizeInput(input: GenerateInput): GenerateInput {
  if (input.type !== "text") return input
  const trimmed = input.text.trim()
  if (!LONE_URL.test(trimmed)) return input
  return { type: "url", url: trimmed }
}
