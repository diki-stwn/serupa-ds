/* Micro-interactions that need the DOM (the CSS does the rest). Shared by Button and Badge. */
type Handler<E extends React.SyntheticEvent> = (e: E) => void;

/** Stops a loading or disabled control's own action (a link, a form submit). The click still bubbles, so a parent's
    handler, an analytics wrapper or a Card's stretched link still hears it. */
export function block(e: { preventDefault(): void }): void {
  e.preventDefault();
}

/** a, then b unless a prevented the default. */
export function chain<E extends React.SyntheticEvent>(a: Handler<E> | undefined, b: Handler<E>): Handler<E> {
  return a ? function (e) { a(e); if (!e.defaultPrevented) b(e); } : b;
}

/** a, then b. */
export function both<E extends React.SyntheticEvent>(a: Handler<E> | undefined, b: Handler<E>): Handler<E> {
  return a ? function (e) { a(e); b(e); } : b;
}

function inactive(el: HTMLElement): boolean {
  return (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true" || el.classList.contains("dk-btn--link");
}

// Enter presses like Space does (Space already sets :active): data-pressed while the key is down.
export function pressKey(e: React.KeyboardEvent<HTMLElement>): void {
  const el = e.currentTarget;
  if ((e.key === "Enter" || e.key === " ") && !e.repeat && !inactive(el)) el.setAttribute("data-pressed", "");
}

export function releaseKey(e: React.SyntheticEvent<HTMLElement>): void {
  e.currentTarget.removeAttribute("data-pressed");
}
