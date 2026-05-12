export function isHTMLElement(node: unknown): node is HTMLElement {
  return node instanceof HTMLElement
}
