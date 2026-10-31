// The document or shadow root a node lives in, so a component rendered inside a shadow root finds what has focus
// and looks ids up there, not in the page around it (where document.activeElement is the shadow host) (GR60).

/** The Document or ShadowRoot that holds node; the page's document when node is missing or not connected to one. */
export function rootOf(node: Node | null | undefined): Document | ShadowRoot {
  const r = node && typeof node.getRootNode === "function" ? node.getRootNode() : null;
  return r && typeof (r as Document | ShadowRoot).getElementById === "function" ? (r as Document | ShadowRoot) : document;
}

/** What has focus in node's document or shadow root (inside a shadow root, the focused element itself, not its host). */
export function activeIn(node: Node | null | undefined): Element | null { return rootOf(node).activeElement; }

