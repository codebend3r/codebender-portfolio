import { describe, expect, it } from "vitest"

import { normalizeInput } from "@utils/normalizeInput"

describe("normalizeInput", () => {
  it("converts a lone http(s) url into a url input", () => {
    expect(
      normalizeInput({ type: "text", text: "https://jobs.lever.co/acme/123" })
    ).toEqual({ type: "url", url: "https://jobs.lever.co/acme/123" })
    expect(
      normalizeInput({ type: "text", text: "http://example.com/job?id=1" })
    ).toEqual({ type: "url", url: "http://example.com/job?id=1" })
  })

  it("trims surrounding whitespace before detecting", () => {
    expect(
      normalizeInput({ type: "text", text: "  https://example.com/job \n" })
    ).toEqual({ type: "url", url: "https://example.com/job" })
  })

  it("leaves text containing a url plus other words as text", () => {
    const input: GenerateInput = {
      type: "text",
      text: "apply at https://example.com/job today",
    }
    expect(normalizeInput(input)).toBe(input)
  })

  it("leaves multi-line text starting with a url as text", () => {
    const input: GenerateInput = {
      type: "text",
      text: "https://example.com/job\nSenior Frontend Engineer",
    }
    expect(normalizeInput(input)).toBe(input)
  })

  it("leaves non-http schemes as text", () => {
    const input: GenerateInput = {
      type: "text",
      text: "javascript:alert(1)",
    }
    expect(normalizeInput(input)).toBe(input)
  })

  it("leaves plain text and image inputs untouched", () => {
    const text: GenerateInput = { type: "text", text: "a job posting" }
    const image: GenerateInput = {
      type: "image",
      mediaType: "image/png",
      dataBase64: "AAAA",
    }
    expect(normalizeInput(text)).toBe(text)
    expect(normalizeInput(image)).toBe(image)
  })
})
