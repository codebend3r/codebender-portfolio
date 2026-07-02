/** Thin wrapper so components can navigate without touching window.location
 *  directly — tests mock this module (jsdom cannot spy on location.assign). */
export function navigate(path: string): void {
  window.location.assign(path)
}
