/* eslint-disable @typescript-eslint/no-explicit-any */

// Local type shim for @svgr/rollup so we can call it in vite.config.ts
// If upstream publishes types, remove this.
declare module "@svgr/rollup" {
  const svgr: (options?: Record<string, unknown>) => any
  export default svgr
}
