// Screen copy for the Codebender Inc. section. This is portfolio-page
// framing, not resume content, so it lives here instead of resume.json
// (which feeds the PDF/DOCX/Angular targets too).

export type CodebenderPillar = {
  title: string
  body: string
}

export const codebenderIntro =
  "My incorporated practice and side-project umbrella, run part-time " +
  "alongside employment since 2011. It's where I ship complete products on " +
  "my own and try new tooling before I bring it to client teams."

export const codebenderPillars: readonly CodebenderPillar[] = [
  {
    title: "Products, end to end",
    body: "Data model, API, design system, tests, CI/CD and deploy, mostly in Next.js and strict TypeScript on Supabase.",
  },
  {
    title: "Agentic development",
    body: "Specs and plans driven through coding agents in small steps, tests as the contract, every diff reviewed.",
  },
  {
    title: "Cross-platform",
    body: "Web, iOS, Android and desktop from one codebase, with Core Web Vitals budgets on every site.",
  },
  {
    title: "Proving ground",
    body: "New runtimes, build tools, rendering models and LLM features tested here before I recommend them to clients.",
  },
]
