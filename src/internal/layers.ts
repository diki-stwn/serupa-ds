// The open modal dialogs (Dialog and Drawer, shown with showModal()), innermost last. While one is open the
// browser makes everything outside it inert: screen readers skip it and it can't be clicked. So what the whole
// page shares (the live regions, the Toaster) moves into the innermost open modal, and back when it closes.
// module state: browser only: showModal() fills it, and a server never opens a dialog.
const modals: HTMLElement[] = [];
const listeners = new Set<() => void>();

/** The innermost open modal, or null. */
export const topModal = (): HTMLElement | null => modals[modals.length - 1] || null;

/** Called when the innermost modal changes; returns a function that stops it. */
export function onModalChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Dialog and Drawer call this right before showModal(). While a modal is open the page can't scroll (overflow:
 *  hidden, in Dialog.css and Drawer.css), which takes away a classic scrollbar (Windows, Linux, and macOS set to show
 *  them) and would make the page behind 15px wider, shifting it sideways. So when the first modal opens, a page that
 *  shows a scrollbar keeps its space (scrollbar-gutter: stable, under data-dk-gutter); one that doesn't gets none. */
export function modalOpening(): void {
  if (modals.length || typeof document === "undefined") return;
  const root = document.documentElement;
  if (window.innerWidth - root.clientWidth > 0) root.setAttribute("data-dk-gutter", "");
  else root.removeAttribute("data-dk-gutter");
}

/** Dialog and Drawer call this right after showModal(). */
export function modalOpened(el: HTMLElement): void {
  const at = modals.indexOf(el);
  if (at >= 0) modals.splice(at, 1);
  modals.push(el);
  listeners.forEach((l) => l());
}

/** …and this when it closes or unmounts. */
export function modalClosed(el: HTMLElement): void {
  const at = modals.indexOf(el);
  if (at < 0) return;
  modals.splice(at, 1);
  listeners.forEach((l) => l());
}

// A press that closed an open popup (a Menu, a Popover) is used up by that: a modal under it doesn't also take it as
// a backdrop click and close. useAnchoredLayer marks the event; Dialog and Drawer check it.
// module state: browser events, weakly held.
const dismissals = new WeakSet<Event>();
/** Marks a press as one that closed a popup. */
export function markDismissal(e: Event): void { dismissals.add(e); }
/** Whether this press closed a popup. */
export const wasDismissal = (e: Event): boolean => dismissals.has(e);
