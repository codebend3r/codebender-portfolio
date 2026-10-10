// Test files that don't touch the DOM opt into `// @vitest-environment node`
// to skip building a jsdom window. The DOM stubs and Testing Library
// cleanup only make sense when there is a document, so load them on demand.
if (typeof document !== "undefined") {
  await import("./setupDom")
}

export {}
