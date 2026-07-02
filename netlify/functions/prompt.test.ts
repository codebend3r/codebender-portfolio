import { describe, expect, it } from "vitest"

import resume from "../../src/data/resume.json"
import {
  WRAPPER_SCHEMA,
  buildSystemPrompt,
  buildUserContent,
  parseGenerateRequest,
  validatePassword,
} from "./prompt"

describe("validatePassword", () => {
  it("accepts a matching password", () => {
    expect(validatePassword("hunter2", "hunter2")).toBe(true)
  })

  it("rejects a wrong password", () => {
    expect(validatePassword("nope", "hunter2")).toBe(false)
  })

  it("rejects when the expected password is unset/empty", () => {
    expect(validatePassword("", "")).toBe(false)
    expect(validatePassword("anything", "")).toBe(false)
  })
})

describe("parseGenerateRequest", () => {
  it("accepts a valid text request", () => {
    const req = parseGenerateRequest({
      password: "p",
      input: { type: "text", text: "job posting" },
    })
    expect(req?.input.type).toBe("text")
  })

  it("accepts a valid image request", () => {
    const req = parseGenerateRequest({
      password: "p",
      input: { type: "image", mediaType: "image/png", dataBase64: "AAAA" },
    })
    expect(req?.input.type).toBe("image")
  })

  it("rejects malformed bodies", () => {
    expect(parseGenerateRequest(null)).toBeNull()
    expect(parseGenerateRequest({})).toBeNull()
    expect(parseGenerateRequest({ password: "p" })).toBeNull()
    expect(
      parseGenerateRequest({ password: "p", input: { type: "text" } })
    ).toBeNull()
    expect(
      parseGenerateRequest({ password: 1, input: { type: "text", text: "x" } })
    ).toBeNull()
  })

  it("rejects oversized payloads", () => {
    expect(
      parseGenerateRequest({
        password: "p",
        input: { type: "text", text: "x".repeat(50_001) },
      })
    ).toBeNull()
    expect(
      parseGenerateRequest({
        password: "p",
        input: {
          type: "image",
          mediaType: "image/png",
          dataBase64: "A".repeat(5_000_001),
        },
      })
    ).toBeNull()
  })
})

describe("buildSystemPrompt", () => {
  it("embeds the base resume and the ground-truth rules", () => {
    const prompt = buildSystemPrompt(resume as Data)
    expect(prompt).toContain(resume.name)
    expect(prompt.toLowerCase()).toContain("never invent")
    expect(prompt).toContain("suggestedName")
  })
})

describe("buildUserContent", () => {
  it("wraps text input as a text block", () => {
    const blocks = buildUserContent({ type: "text", text: "the posting" })
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ type: "text" })
  })

  it("wraps image input as an image block plus instruction", () => {
    const blocks = buildUserContent({
      type: "image",
      mediaType: "image/png",
      dataBase64: "AAAA",
    })
    expect(blocks[0]).toMatchObject({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: "AAAA" },
    })
    expect(blocks[1]).toMatchObject({ type: "text" })
  })
})

describe("WRAPPER_SCHEMA", () => {
  it("requires resume and suggestedName with no extra props", () => {
    expect(WRAPPER_SCHEMA.required).toEqual(["resume", "suggestedName"])
    expect(WRAPPER_SCHEMA.additionalProperties).toBe(false)
  })

  it("mirrors every top-level Data key", () => {
    const dataKeys = Object.keys(resume).sort()
    const schemaKeys = Object.keys(
      WRAPPER_SCHEMA.properties.resume.properties
    ).sort()
    expect(schemaKeys).toEqual(dataKeys)
  })
})
