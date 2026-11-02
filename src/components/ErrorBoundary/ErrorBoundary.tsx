"use client";
import * as React from "react";
import { cn } from "../../internal/cn";
import { deepActive } from "../../internal/root";
import { named } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import type { ErrorBoundaryLabels } from "./labels";
import { Alert } from "../Alert/Alert";
import { Button } from "../Button/Button";
import { en as words } from "./labels";

export interface ErrorBoundaryFallbackProps {
  /** What was thrown. */
  error: unknown;
  /** Clears the error and renders the children again. */
  reset: () => void;
}

export interface ErrorBoundaryProps {
  /** The part of the page to guard. */
  children?: React.ReactNode;
  /** What to show instead when something inside throws while rendering. Default: a danger Alert with a title, a
      description and a "Try again" button. A function gets { error, reset }. */
  fallback?: React.ReactNode | ((props: ErrorBoundaryFallbackProps) => React.ReactNode);
  /** The default fallback's title. Default: "Something went wrong" (the errorTitle label). */
  title?: React.ReactNode;
  /** The default fallback's message. Default: "This part of the page couldn't load." (errorDescription). */
  description?: React.ReactNode;
  /** Called with the error and React's component stack, for logging or reporting. */
  onError?: (error: unknown, info: React.ErrorInfo) => void;
  /** Called when the error is cleared: Try again, reset(), or a change in resetKeys. */
  onReset?: () => void;
  /** Values that, when one changes, clear the error and render the children again (a route, an id). */
  resetKeys?: ReadonlyArray<unknown>;
  /** A class for the default fallback's box. */
  className?: string;
}

interface BoundaryProps extends ErrorBoundaryProps { labels: ErrorBoundaryLabels }
interface BoundaryState { error: unknown; failed: boolean }

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
/** Where focus was when the error was cleared: the focused element and each of its ancestors with the siblings
 *  around it, so once the fallback has gone, the place it held (and the content now there) can be found again. */
type Spot = Array<{ node: Node; before: Node | null; after: Node | null }>;
const spot = (el: Element): Spot => { const out: Spot = []; for (let n: Node | null = el; n && n !== document.body; n = n.parentNode) out.push({ node: n, before: n.previousSibling, after: n.nextSibling }); return out; };
/** The first focusable element in what now stands where the fallback stood; else its first element, made focusable
 *  from script only (tabIndex -1) for this one move. */
/** In the Tab order and shown: not a roving tab that isn't the current one (tabindex -1), or a hidden control (L8E24),
 *  or a control a disabled <fieldset> turns off, which matches the selector but can't take focus (L8E76). */
const reach = (el: HTMLElement) => el.tabIndex >= 0 && !el.matches(":disabled") && el.getClientRects().length > 0;
function recovered(was: Spot): HTMLElement | null {
  const i = was.findIndex((x) => x.node.isConnected);
  if (i <= 0) return null;   // the focused element is still there (focus wasn't in the fallback), or nothing is
  const gone = was[i - 1], parent = was[i].node;
  const from = gone.before && gone.before.parentNode === parent ? gone.before.nextSibling : parent.firstChild;
  const to = gone.after && gone.after.parentNode === parent ? gone.after : null;
  let first: HTMLElement | null = null;
  for (let n = from; n && n !== to; n = n.nextSibling) {
    if (!(n instanceof HTMLElement)) continue;
    if (n.matches(FOCUSABLE) && reach(n)) return n;
    const inner = Array.from(n.querySelectorAll<HTMLElement>(FOCUSABLE)).find(reach);
    if (inner) return inner;
    if (!first) first = n;
  }
  if (first && !first.hasAttribute("tabindex")) {
    first.tabIndex = -1;
    first.addEventListener("blur", () => first.removeAttribute("tabindex"), { once: true });
  }
  return first;
}

const changed = (a?: ReadonlyArray<unknown>, b?: ReadonlyArray<unknown>) =>
  (a || []).length !== (b || []).length || (a || []).some((v, i) => !Object.is(v, (b || [])[i]));

// Error boundaries are class components: there's no hook for componentDidCatch. The class is made inside a pure
// call because a bundler keeps a bare `class … extends React.Component` in every bundle, imported or not.
const Boundary = /* @__PURE__ */ (() => class Boundary extends React.Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { error: null, failed: false };
  box = React.createRef<HTMLDivElement>();
  // Set when the error is cleared while focus is on the page: where it was, to find the recovered content by.
  was: Spot | null = null;
  static getDerivedStateFromError(error: unknown): BoundaryState { return { error, failed: true }; }
  override componentDidCatch(error: unknown, info: React.ErrorInfo) { if (this.props.onError) this.props.onError(error, info); }
  override componentDidUpdate(prev: BoundaryProps, was: BoundaryState) {
    if (this.state.failed && was.failed && changed(prev.resetKeys, this.props.resetKeys)) { this.reset(); return; }
    // The crash took focus with it (to <body>): put it on the fallback, so keyboard and screen reader users are
    // where the content was, and hear what happened.
    if (this.state.failed && !was.failed) {
      const active = deepActive();
      if ((!active || active === document.body) && this.box.current) this.box.current.focus();
    }
    // Cleared from inside the fallback (Try again, a custom fallback's reset(), or resetKeys while focus was in it):
    // the fallback went with focus in it, which fell to <body>. Put it on the recovered content (FL1).
    if (!this.state.failed && was.failed && this.was) {
      const at = this.was;
      this.was = null;
      const active = deepActive();
      if (!active || active === document.body) { const t = recovered(at); if (t) t.focus(); }
    }
  }
  // Focus is read through shadow roots, so inside one it's the focused element, not the host (GR95).
  reset = () => {
    const active = deepActive();
    this.was = active && active !== document.body ? spot(active) : null;
    this.setState({ error: null, failed: false });
    if (this.props.onReset) this.props.onReset();
  };
  override render() {
    if (!this.state.failed) return this.props.children;
    const p = this.props;
    if (typeof p.fallback === "function") return p.fallback({ error: this.state.error, reset: this.reset });
    if (p.fallback !== undefined) return p.fallback;
    return (
      <div ref={this.box} tabIndex={-1} className={cn("dk-error-boundary", p.className)} data-component="error-boundary">
        <Alert tone="danger" title={p.title ?? p.labels.errorTitle}
          actions={<Button size="sm" variant="outline" onClick={this.reset}>{p.labels.tryAgain}</Button>}>
          {p.description ?? p.labels.errorDescription}
        </Alert>
      </div>
    );
  }
})();

/* ErrorBoundary: catches an error thrown while rendering anything inside it, so one broken widget doesn't blank
   the whole page. It shows a danger Alert (role="alert", read at once) with "Try again", which renders the
   children again; focus moves to it when the crash left focus nowhere. fallback replaces the Alert; resetKeys
   clear the error when they change. It can't catch errors in event handlers or async code (React doesn't
   route those to boundaries): handle those where they happen. */
/** Catches a render error in its children and shows a fallback with "Try again", so one broken part doesn't take the page down. */
export const ErrorBoundary = /* @__PURE__ */ named("ErrorBoundary", function ErrorBoundary(props: ErrorBoundaryProps): React.ReactElement {
  const labels = useSettings(words).labels;
  return <Boundary {...props} labels={labels} />;
});
