import { getStore } from "@netlify/blobs"

import { JOB_ID_PATTERN } from "./lib/prompt"

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

// Poll endpoint for the /generate background job. A missing blob means the
// background function hasn't started (or written) yet — report pending and
// let the client's poll cap decide when to give up.
export default async (req: Request): Promise<Response> => {
  if (req.method !== "GET") return json(405, { error: "method not allowed" })

  const id = new URL(req.url).searchParams.get("id") ?? ""
  if (!JOB_ID_PATTERN.test(id)) return json(400, { error: "invalid job id" })

  const jobs = getStore({ name: "generate-jobs", consistency: "strong" })
  const job = (await jobs.get(id, { type: "json" })) as GenerateJob | null
  return json(200, job ?? ({ status: "pending" } satisfies GenerateJob))
}
