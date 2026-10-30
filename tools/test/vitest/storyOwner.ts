// Whether an element was made by the story file rather than by the library: the story-wide checks hold a component
// to what it renders, not to what its story wrote around it (a decorator's max-width, a caption, a list it maps).
// Found from where React's development build says the element was made (its _debugStack), as the strict-CSP sweep
// and the digits check both need.
export type Fiber = { return: Fiber | null; memoizedProps?: Record<string, unknown> & { style?: unknown }; _debugStack?: Error; _debugOwner?: { type?: unknown } | null };

// The library's components, and the render functions inside forwardRef and memo, by identity.
const LIBRARY = new Set<unknown>(Object.values(await import('../../../src/index')).flatMap((v) => (v && (typeof v === 'object' || typeof v === 'function') ? [v, (v as { render?: unknown }).render, (v as { type?: unknown }).type] : [])).filter(Boolean));

export const fiberOf = (el: Element) => {
  const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
  return key ? (Reflect.get(el, key) as Fiber) : null;
};

export function fromStory(f: Fiber) {
  // The first frame outside node_modules with a place in a file: a frame ends in :line:col, and neither the
  // "Error: …" header line nor a built-in's frame (WebKit's "from@[native code]", for Array.from) does.
  const frame = String(f._debugStack?.stack || '').split('\n').find((l) => /:\d+:\d+\)?$/.test(l) && !l.includes('/node_modules/'));
  if (frame) return /\.stories\.tsx|\/tools\/test\//.test(frame);
  // WebKit runs ES modules with proper tail calls, so a story's arrow function that returns JSX (a decorator's
  // wrapper) leaves no frame behind. Then the element's owner says it: made by one of the library's components, it
  // is the component's; made by anything else, the story's.
  const owner = f._debugOwner?.type;
  return !!owner && !LIBRARY.has(owner);
}

// An element a story's render prop returns (SortableList's renderItem={(t) => <div style={…}>}) is the story's too,
// but in WebKit that arrow is a tail call as well, and what's left is the library's frame that called it, with the
// library component as owner. So, only for an element whose owner was handed a render function: its inline style is
// the story's if every one of its declarations is written in the story file, as `key: value`.
type Owner = { type?: unknown; memoizedProps?: Record<string, unknown> };
export function fromRenderProp(f: Fiber, storySource: string) {
  const owner = f._debugOwner as Owner | null | undefined;
  const style = f.memoizedProps?.style;
  if (!owner || !LIBRARY.has(owner.type) || !style || typeof style !== 'object') return false;
  if (!Object.entries(owner.memoizedProps || {}).some(([k, v]) => /^render[A-Z]/.test(k) && typeof v === 'function')) return false;
  const pairs = Object.entries(style as Record<string, unknown>);
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return pairs.length > 0 && pairs.every(([k, v]) => new RegExp(`\\b${esc(k)}\\s*:\\s*['"\`]?${esc(String(v))}['"\`]?\\s*[,}]`).test(storySource));
}
