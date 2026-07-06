import { describe, expect, it } from "vitest"

import resume from "../../../src/data/resume.json"
import {
  PATCH_SCHEMA,
  buildSystemPrompt,
  buildUserContent,
  isImageMediaType,
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

const JOB_ID = "3f2a9c1e-7b4d-4e6f-9a2b-1c3d5e7f9a0b"

describe("parseGenerateRequest", () => {
  it("accepts a valid text request", () => {
    const req = parseGenerateRequest({
      jobId: JOB_ID,
      password: "p",
      input: { type: "text", text: "job posting" },
    })
    expect(req?.input.type).toBe("text")
    expect(req?.jobId).toBe(JOB_ID)
  })

  it("accepts a valid image request", () => {
    const req = parseGenerateRequest({
      jobId: JOB_ID,
      password: "p",
      input: { type: "image", mediaType: "image/png", dataBase64: "AAAA" },
    })
    expect(req?.input.type).toBe("image")
  })

  it("accepts a valid url request", () => {
    const req = parseGenerateRequest({
      jobId: JOB_ID,
      password: "p",
      input: { type: "url", url: "https://jobs.lever.co/acme/123?src=x" },
    })
    expect(req?.input).toEqual({
      type: "url",
      url: "https://jobs.lever.co/acme/123?src=x",
    })
  })

  it("rejects non-http(s) or unparseable urls", () => {
    const withUrl = (url: unknown) =>
      parseGenerateRequest({
        jobId: JOB_ID,
        password: "p",
        input: { type: "url", url },
      })
    expect(withUrl("javascript:alert(1)")).toBeNull()
    expect(withUrl("ftp://example.com/file")).toBeNull()
    expect(withUrl("not a url")).toBeNull()
    expect(withUrl("")).toBeNull()
    expect(withUrl(42)).toBeNull()
    expect(withUrl(`https://example.com/${"x".repeat(2_049)}`)).toBeNull()
  })

  it("rejects a missing or malformed jobId", () => {
    const withJobId = (jobId: unknown) =>
      parseGenerateRequest({
        jobId,
        password: "p",
        input: { type: "text", text: "posting" },
      })
    expect(withJobId(undefined)).toBeNull()
    expect(withJobId("")).toBeNull()
    expect(withJobId("short")).toBeNull()
    expect(withJobId("../escape-the-store")).toBeNull()
    expect(withJobId("z".repeat(36))).toBeNull()
    expect(withJobId(JOB_ID)).not.toBeNull()
  })

  it("rejects malformed bodies", () => {
    expect(parseGenerateRequest(null)).toBeNull()
    expect(parseGenerateRequest({})).toBeNull()
    expect(parseGenerateRequest({ jobId: JOB_ID, password: "p" })).toBeNull()
    expect(
      parseGenerateRequest({
        jobId: JOB_ID,
        password: "p",
        input: { type: "text" },
      })
    ).toBeNull()
    expect(
      parseGenerateRequest({
        jobId: JOB_ID,
        password: 1,
        input: { type: "text", text: "x" },
      })
    ).toBeNull()
  })

  it("rejects oversized payloads", () => {
    expect(
      parseGenerateRequest({
        jobId: JOB_ID,
        password: "p",
        input: { type: "text", text: "x".repeat(50_001) },
      })
    ).toBeNull()
    expect(
      parseGenerateRequest({
        jobId: JOB_ID,
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
    const prompt = buildSystemPrompt(resume)
    expect(prompt).toContain(resume.name)
    expect(prompt.toLowerCase()).toContain("never invent")
    expect(prompt).toContain("suggestedName")
  })
})

describe("isImageMediaType", () => {
  it("accepts the Claude-supported image formats", () => {
    const accepted = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    expect(accepted.every(isImageMediaType)).toBe(true)
  })

  it("rejects everything else", () => {
    expect(isImageMediaType("image/svg+xml")).toBe(false)
    expect(isImageMediaType("image/tiff")).toBe(false)
    expect(isImageMediaType("text/html")).toBe(false)
    expect(isImageMediaType("")).toBe(false)
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

describe("PATCH_SCHEMA", () => {
  it("requires every patch field with no extra props", () => {
    expect(PATCH_SCHEMA.required).toEqual([
      "title",
      "summary",
      "technical_skills",
      "work_experience",
      "suggestedName",
    ])
    expect(PATCH_SCHEMA.additionalProperties).toBe(false)
  })

  it("patches work_experience by index and achievements only", () => {
    const entry = PATCH_SCHEMA.properties.work_experience.items
    expect(entry.required).toEqual(["index", "achievements"])
    expect(entry.additionalProperties).toBe(false)
  })
})
