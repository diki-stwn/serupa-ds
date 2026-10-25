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

function reducedMotion(): boolean {
  return !!(typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

// Enter presses like Space does (Space already sets :active): data-pressed while the key is down.
export function pressKey(e: React.KeyboardEvent<HTMLElement>): void {
  const el = e.currentTarget;
  if ((e.key === "Enter" || e.key === " ") && !e.repeat && !inactive(el)) el.setAttribute("data-pressed", "");
}

export function releaseKey(e: React.SyntheticEvent<HTMLElement>): void {
  e.currentTarget.removeAttribute("data-pressed");
}

// Ripple: a circle from the press point, big enough to cover the button (or badge), that fades once released
// only after it has spread all the way, so a quick click still shows the whole wave.
export function ripple(e: React.PointerEvent<HTMLElement>): void {
  const el = e.currentTarget;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (inactive(el) || reducedMotion()) return;
  const pre = el.classList.contains("dk-badge") ? "badge" : "btn";   // Badge shares it, with its own classes and token
  const host = el.querySelector(".dk-" + pre + "__ripples");
  if (!host || parseFloat(getComputedStyle(el).getPropertyValue(pre === "badge" ? "--badge-ripple-opacity" : "--button-ripple-opacity")) === 0) return;
  const r = host.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  const d = 2 * Math.sqrt(Math.pow(Math.max(x, r.width - x), 2) + Math.pow(Math.max(y, r.height - y), 2));
  const dot = document.createElement("span");
  dot.className = "dk-" + pre + "__ripple";
  dot.style.width = dot.style.height = d + "px";
  dot.style.left = x - d / 2 + "px";
  dot.style.top = y - d / 2 + "px";
  host.appendChild(dot);
  const started = Date.now(), spread = parseFloat(getComputedStyle(dot).animationDuration) * 1000 || 0;
  function remove() { if (dot.parentNode) dot.parentNode.removeChild(dot); }
  function release() {
    document.removeEventListener("pointerup", release, true);
    document.removeEventListener("pointercancel", release, true);
    setTimeout(function () {
      dot.addEventListener("transitionend", remove);
      dot.className += " dk-" + pre + "__ripple--out";
      setTimeout(remove, 2000);   // in case transitionend never fires (duration 0, tab hidden)
    }, Math.max(0, started + spread - Date.now()));
  }
  document.addEventListener("pointerup", release, true);
  document.addEventListener("pointercancel", release, true);
}
